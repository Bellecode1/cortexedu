const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env.local") });
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const { resend } = require("./src/lib/resend");
const db = require("./src/lib/database");
const { supabase } = require("./src/lib/supabase");

const server = express();
const port = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ══════════════════════════════════════════
// MIDDLEWARES
// ══════════════════════════════════════════

server.use(cors({
  origin: [FRONTEND_URL, process.env.CORS_ORIGIN].filter(Boolean),
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true,
}));

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Middleware pour simuler un délai en dev
if (process.env.NODE_ENV !== "production") {
  server.use((req, res, next) => {
    setTimeout(next, 500);
  });
}

// ══════════════════════════════════════════
// MULTER — Upload (memoryStorage → Supabase)
// ══════════════════════════════════════════

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté. Formats acceptés : PDF, JPG, PNG, DOC, DOCX"));
  }
};

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Helper: uploader un fichier vers Supabase Storage
async function uploadToSupabase(bucket, file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  const fileName = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData?.publicUrl || "";
}

// Helper: supprimer un fichier de Supabase Storage
async function deleteFromSupabase(bucket, fileUrl) {
  if (!fileUrl) return;
  // Extraire le path depuis l'URL
  const urlParts = fileUrl.split(`${bucket}/`);
  if (urlParts.length < 2) return;
  const filePath = urlParts[1];
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) console.error("Erreur suppression fichier:", error);
}

// ══════════════════════════════════════════
// JWT
// ══════════════════════════════════════════

const JWT_SECRET = process.env.JWT_SECRET || "votre_clé_secrète_en_dev";

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// ══════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════

// Connexion
server.post("/api/login", async (req, res) => {
  try {
    const { email } = req.body;
    const password = req.body.password;

    const users = await db.getAll("users");
    const user = users.find((u) => u.mail === email);

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Compte non activé ou mot de passe non défini" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Profile
server.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await db.getById("users", req.user.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        surname: user.surname,
        mail: user.mail,
        telephone: user.telephone,
        role: user.role,
        dob: user.dob,
        verificationCode: user.verificationCode,
        verified: user.verified,
        sexe: user.sexe,
        adresse: user.adresse,
        studentArrayId: user.studentArrayId || [],
        brancnId: user.brancnId,
      },
    });
  } catch (error) {
    console.error("Erreur profile:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// USERS ROUTES
// ══════════════════════════════════════════

// Obtenir tous les utilisateurs (avec pagination)
server.get("/api/users", async (req, res) => {
  try {
    const { page = 1, pageSize = 5, gender, role } = req.query;
    let users = await db.getAll("users");

    if (gender) {
      const genders = gender.split(",");
      users = users.filter((user) => genders.includes(user.sexe));
    }

    if (role) {
      const roles = role.split(",");
      users = users.filter((user) => roles.includes(user.role));
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = users.slice(start, end);

    res.json({
      data: paginatedUsers,
      totalCount: users.length,
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Erreur récupération users:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir un utilisateur par ID
server.get("/api/users/:id", async (req, res) => {
  try {
    const user = await db.getById("users", req.params.id);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir un utilisateur par email ou téléphone
server.get("/api/user/mail/:email/:phone", async (req, res) => {
  try {
    const { email, phone } = req.params;
    const users = await db.getAll("users");
    const userData = users.find(
      (user) => user.mail === email || user.telephone === phone
    );
    res.json(userData || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Obtenir les étudiants
server.get("/api/userStudents", async (req, res) => {
  try {
    const users = await db.getAll("users");
    const students = users.filter((user) => user.role === "Student");
    const StudentData = students.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });
    res.json(StudentData || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer un utilisateur
server.post("/api/user", async (req, res) => {
  try {
    const payload = req.body;
    const email = payload.mail;
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const passwordToHash = payload.password || "123456";
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const userData = {
      ...payload,
      password: passwordHash,
      id: uuidv4(),
      verificationCode,
    };
    const { confirm_password, ...newUserData } = userData;

    const created = await db.insert("users", newUserData);

    // Envoyer l'email
    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Validate Account",
        html: `
          <div>
            <h1>Bienvenue sur CortexEdu ☺!</h1>
            <p>ci-dessous vous avez votre code de connexion à votre compte:</p>
            <p>${verificationCode}</p>
            <a href="${FRONTEND_URL}/login">Me connecter</a>
            <p>pour plus de sécurité, veuillez mettre à jour votre mot de passe dans votre compte</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.warn("Email could not be sent:", emailError);
    }

    res.status(201).json(created);
  } catch (error) {
    console.error("Erreur création user:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Vérification de compte
server.get("/api/verifyAccount", async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await db.getAll("users");
    const user = users.find(
      (u) => u.mail === decoded.email && u.verificationCode === decoded.code
    );

    if (user) {
      await db.updateById("users", user.id, { verified: true, verificationCode: "" });
      return res.redirect(`${FRONTEND_URL}/login?verified=true`);
    }

    res.redirect(`${FRONTEND_URL}/login?verified=false`);
  } catch (error) {
    res.redirect(`${FRONTEND_URL}/login?verified=false`);
  }
});

// Supprimer un utilisateur
server.delete("/api/deleteUser/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    const user = await db.getById("users", userID);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé", id: userID });
    }
    await db.deleteById("users", userID);
    res.status(200).json({ success: true, id: userID });
  } catch (error) {
    console.error("Erreur suppression user:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour un utilisateur
server.patch("/api/updateUser/:id", async (req, res) => {
  try {
    const userID = req.params.id;
    const newUserData = req.body;
    const existingUser = await db.getById("users", userID);

    if (!existingUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé", id: userID });
    }

    const sanitizedData = { ...newUserData };
    if (existingUser.role === "Student") {
      delete sanitizedData.brancnId;
    }
    if (existingUser.role === "Parent") {
      delete sanitizedData.studentArrayId;
    }

    const updated = await db.updateById("users", userID, sanitizedData);
    res.status(200).json({ success: true, user: updated });
  } catch (error) {
    console.error("Erreur mise à jour user:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// BRANCH ROUTES
// ══════════════════════════════════════════

// Obtenir toutes les branches
server.get("/api/branchs", async (req, res) => {
  try {
    const branchs = await db.getAll("branch");
    res.json(branchs || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer une branche
server.post("/api/branch", async (req, res) => {
  try {
    const newBranch = req.body;
    const branchData = {
      ...newBranch,
      id: uuidv4(),
      create_at: new Date().toISOString(),
    };
    const created = await db.insert("branch", branchData);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer une branche
server.delete("/api/deleteBranch/:id", async (req, res) => {
  try {
    const branchID = req.params.id;
    const branch = await db.getById("branch", branchID);
    if (!branch) {
      return res.status(404).json({ error: "branche non trouvée", id: branchID });
    }
    await db.deleteById("branch", branchID);
    res.status(200).json({ success: true, id: branchID });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour une branche
server.patch("/api/updatebranch/:id", async (req, res) => {
  try {
    const branchId = req.params.id;
    const existing = await db.getById("branch", branchId);
    if (!existing) {
      return res.status(404).json({ error: "branche non trouvée", id: branchId });
    }
    const updated = await db.updateById("branch", branchId, req.body);
    res.status(200).json({ success: true, branch: updated });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// QUIZ ROUTES
// ══════════════════════════════════════════

// Obtenir tous les quizs
server.get("/api/quiz", async (req, res) => {
  try {
    const quizs = await db.getAll("quiz");
    res.json(quizs || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Quizs pour un étudiant (par branche)
server.get("/api/quiz/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const users = await db.getAll("users");
    const student = users.find((u) => u.id === studentId);

    if (!student || student.role !== "Student") {
      return res.json([]);
    }

    const quizs = await db.getAll("quiz");
    const studentBranch = student.brancnId;

    if (studentBranch && studentBranch.trim() !== "") {
      const branchs = await db.getAll("branch");
      const branchExists = branchs && branchs.some((b) => b.id === studentBranch);

      if (branchExists) {
        const filteredQuizs = quizs.filter(
          (quiz) => quiz.branchId && quiz.branchId.includes(studentBranch)
        );
        return res.json(filteredQuizs || []);
      }
      return res.json(quizs || []);
    }

    res.json(quizs || []);
  } catch (error) {
    console.error("Erreur récupération quizs étudiant:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Quizs par branche
server.get("/api/quiz/:userBranch", async (req, res) => {
  try {
    const branchUser = req.params.userBranch;
    if (branchUser === "student" || branchUser === "id" || branchUser === "authorId") {
      return res.json([]);
    }
    const quizs = await db.getAll("quiz");
    const filteredQuizs = quizs.filter(
      (quiz) => quiz.branchId && quiz.branchId.includes(branchUser)
    );
    res.json(filteredQuizs || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Quiz par ID
server.get("/api/quiz/id/:id", async (req, res) => {
  try {
    const quiz = await db.getById("quiz", req.params.id);
    res.json(quiz || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Quizs par auteur
server.get("/api/quiz/authorId/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const quizs = await db.getAll("quiz");
    const quizsUserId = quizs.filter((quiz) => quiz.authorId === userId);
    res.json(quizsUserId || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer un quiz
server.post("/api/quiz", async (req, res) => {
  try {
    const payload = req.body;
    const newQuiz = { ...payload, id: uuidv4(), create_At: new Date().toISOString() };
    const created = await db.insert("quiz", newQuiz);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Supprimer un quiz
server.delete("/api/deleteQuiz/:id", async (req, res) => {
  try {
    const quizID = req.params.id;
    const quiz = await db.getById("quiz", quizID);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz non trouvé", id: quizID });
    }
    await db.deleteById("quiz", quizID);
    res.status(200).json({ success: true, id: quizID });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour un quiz
server.patch("/api/updateQuiz/:id", async (req, res) => {
  try {
    const quizID = req.params.id;
    const existing = await db.getById("quiz", quizID);
    if (!existing) {
      return res.status(404).json({ error: "Quiz non trouvé", id: quizID });
    }
    const updated = await db.updateById("quiz", quizID, req.body);
    res.status(200).json({ success: true, quiz: updated });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Ajouter des questions à un quiz
server.put("/api/addQuestions/:id", async (req, res) => {
  try {
    const quizId = req.params.id;
    const { quizQuestions } = req.body;
    const existing = await db.getById("quiz", quizId);
    if (!existing) {
      return res.status(404).json({ error: "quiz non trouvé", id: quizId });
    }
    const updated = await db.updateById("quiz", quizId, { quizQuestions });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// RESULTS ROUTES
// ══════════════════════════════════════════

// Créer un résultat
server.post("/api/result", async (req, res) => {
  try {
    const currentResult = req.body;
    const newResult = { ...currentResult, id: uuidv4() };
    const created = await db.insert("results", newResult);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Mettre à jour un résultat
server.patch("/api/result/:userId/:quizId/", async (req, res) => {
  try {
    const { userId, quizId } = req.params;
    const allResults = await db.getAll("results");
    const result = allResults.find(
      (r) => r.studentId === userId && r.quizId === quizId
    );
    if (!result) {
      return res.status(404).json({ error: "Résultat non trouvé" });
    }
    const updated = await db.updateById("results", result.id, req.body);
    res.status(200).json({ success: true, result: updated });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultats par quiz
server.get("/api/results/quizId/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    // Attention : cette route est aussi utilisée comme /api/results/quizId/:singleQuizID
    // et /api/results/quizId/authorId/:quizId/:authorId
    // → Vérifier si c'est un vrai quizId ou un autre pattern
    if (quizId === "authorId") {
      return res.status(400).json({ error: "Utilisez /api/results/quizId/authorId/:quizId/:authorId" });
    }
    const allResults = await db.getAll("results");
    const quizResults = allResults.filter((r) => r.quizId === quizId);
    if (quizResults.length === 0) {
      return res.status(404).json({ error: "Aucun résultat disponible pour ce quiz" });
    }
    res.json(quizResults);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultats par quiz + auteur (avec noms étudiants)
server.get("/api/results/quizId/authorId/:quizId/:authorId", async (req, res) => {
  try {
    const { quizId, authorId } = req.params;
    const allResults = await db.getAll("results");
    const allUsers = await db.getAll("users");

    const quizResults = allResults.filter(
      (result) => result.quizId === quizId && result.authorId === authorId
    );

    const resultsByStudentId = {};
    quizResults.forEach((result) => {
      if (!resultsByStudentId[result.studentId]) {
        resultsByStudentId[result.studentId] = [];
      }
      resultsByStudentId[result.studentId].push(result);
    });

    const combinedData = allUsers
      .filter((user) => resultsByStudentId[user.id])
      .map((user) => ({
        ...user,
        quizResults: resultsByStudentId[user.id] || [],
      }));

    if (combinedData.length === 0) {
      return res.status(404).json({ message: "Aucun résultat trouvé pour ce quiz" });
    }

    res.json(combinedData);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultats pour un parent (enfants)
server.get("/api/results/parentId/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;
    const allResults = await db.getAll("results");
    const allUsers = await db.getAll("users");

    const parentUser = allUsers.find((user) => user.id === parentId);
    if (!parentUser) {
      return res.status(404).json({ message: "Parent non trouvé" });
    }

    if (!parentUser.studentArrayId || parentUser.studentArrayId.length === 0) {
      return res.status(404).json({ message: "Aucun étudiant associé à ce parent" });
    }

    let quizResults = [];
    parentUser.studentArrayId.forEach((studentId) => {
      const studentResults = allResults.filter(
        (result) => result.studentId === studentId && result.status === "complete"
      );
      quizResults = quizResults.concat(studentResults);
    });

    const resultsByStudentId = {};
    quizResults.forEach((result) => {
      if (!resultsByStudentId[result.studentId]) {
        resultsByStudentId[result.studentId] = [];
      }
      resultsByStudentId[result.studentId].push(result);
    });

    const combinedDataStudent = [];
    parentUser.studentArrayId.forEach((studentId) => {
      const student = allUsers.find((user) => user.id === studentId);
      if (student) {
        combinedDataStudent.push({
          student: {
            id: student.id,
            name: student.name,
            surname: student.surname,
            telephone: student.telephone,
          },
          quizResults: resultsByStudentId[studentId] || [],
        });
      }
    });

    if (combinedDataStudent.length === 0) {
      return res.status(404).json({
        message: "Aucun résultat trouvé pour les étudiants de ce parent",
      });
    }

    res.json(combinedDataStudent);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultat par userId + quizId
server.get("/api/results/:userId/:quizId", async (req, res) => {
  try {
    const { userId, quizId } = req.params;
    const allResults = await db.getAll("results");
    const result = allResults.find(
      (r) => r.studentId === userId && r.quizId === quizId
    );
    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: "aucun resultat disponible pour le moment" });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultats d'un auteur
server.get("/api/results/all/author/:authorId", async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const allResults = await db.getAll("results");
    const allUsers = await db.getAll("users");

    const authorResults = allResults.filter(
      (r) => r.authorId === authorId && r.status === "complete"
    );

    const enriched = authorResults.map((r) => {
      const student = allUsers.find((u) => u.id === r.studentId);
      return {
        ...r,
        studentName: student
          ? `${student.name} ${student.surname}`.trim() || r.studentId
          : r.studentId,
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Résultats d'un étudiant
server.get("/api/results/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Éviter les conflits avec d'autres routes
    if (!userId || userId === "quizId" || userId === "all" || userId === "parentId") {
      return res.json([]);
    }
    const allResults = await db.getAll("results");
    const userResults = allResults.filter(
      (result) => result.studentId === userId && result.status === "complete"
    );
    res.json(userResults || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// EXAMS ROUTES
// ══════════════════════════════════════════

// Créer une épreuve
server.post("/api/exams", (req, res) => {
  uploadMemory.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Fichier trop volumineux. Maximum 20 MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { title, description, teacher_id, branch_id, due_date } = req.body;
      if (!title || !teacher_id) {
        return res.status(400).json({ error: "Titre et enseignant requis" });
      }

      let file_path = "";
      if (req.file) {
        file_path = await uploadToSupabase("exams", req.file, "exams");
      }

      const newExam = {
        id: uuidv4(),
        title,
        description: description || "",
        file_path,
        teacher_id,
        teacher_name: "",
        branch_id: branch_id || null,
        due_date: due_date || null,
        created_at: new Date().toISOString(),
      };

      const created = await db.insert("exams", newExam);
      res.status(201).json(created);
    } catch (error) {
      console.error("Erreur création épreuve:", error);
      res.status(500).json({ error: "Erreur lors de la création de l'épreuve" });
    }
  });
});

// Obtenir toutes les épreuves
server.get("/api/exams", async (req, res) => {
  try {
    const exams = await db.getAll("exams");
    const users = await db.getAll("users");
    const enriched = exams.map((exam) => {
      const teacher = users.find((u) => u.id === exam.teacher_id);
      return {
        ...exam,
        teacher_name: teacher ? `${teacher.name} ${teacher.surname}` : "Inconnu",
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Épreuves d'un enseignant
server.get("/api/exams/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const exams = await db.getAll("exams");
    const filtered = exams.filter((e) => e.teacher_id === teacherId);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Épreuves par branche
server.get("/api/exams/branch/:branchId", async (req, res) => {
  try {
    const branchId = req.params.branchId;
    const exams = await db.getAll("exams");
    const filtered = exams.filter((e) => e.branch_id === branchId || !e.branch_id);
    const users = await db.getAll("users");
    const enriched = filtered.map((exam) => {
      const teacher = users.find((u) => u.id === exam.teacher_id);
      return {
        ...exam,
        teacher_name: teacher ? `${teacher.name} ${teacher.surname}` : "Inconnu",
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Supprimer une épreuve
server.delete("/api/exams/:id", async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = await db.getById("exams", examId);
    if (!exam) return res.status(404).json({ error: "Épreuve non trouvée" });
    
    // Supprimer aussi le fichier du storage
    if (exam.file_path) {
      await deleteFromSupabase("exams", exam.file_path);
    }
    
    await db.deleteById("exams", examId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// ══════════════════════════════════════════
// SUBMISSIONS ROUTES
// ══════════════════════════════════════════

// Créer une soumission
server.post("/api/submissions", (req, res) => {
  uploadMemory.single("file")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "Fichier trop volumineux. Maximum 10 MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { exam_id, student_id } = req.body;
      if (!exam_id || !student_id) {
        return res.status(400).json({ error: "Épreuve et étudiant requis" });
      }

      const allSubmissions = await db.getAll("submissions");
      const existing = allSubmissions.find(
        (s) => s.exam_id === exam_id && s.student_id === student_id
      );
      if (existing) {
        return res.status(409).json({ error: "Vous avez déjà soumis votre copie pour cette épreuve" });
      }

      let file_path = "";
      if (req.file) {
        file_path = await uploadToSupabase("submissions", req.file, "submissions");
      }

      const newSubmission = {
        id: uuidv4(),
        exam_id,
        student_id,
        file_path,
        submitted_at: new Date().toISOString(),
        grade: null,
        comment: null,
        graded_by: null,
        graded_at: null,
      };

      const created = await db.insert("submissions", newSubmission);

      // Notification aux enseignants
      const allExams = await db.getAll("exams");
      const exam = allExams.find((e) => e.id === exam_id);
      if (exam) {
        const allUsers = await db.getAll("users");
        const student = allUsers.find((u) => u.id === student_id);
        const notifiedIds = new Set([exam.teacher_id]);

        if (exam.branch_id) {
          const branchTeachers = allUsers.filter(
            (u) => u.role === "Teacher" && u.brancnId === exam.branch_id && u.id !== exam.teacher_id
          );
          branchTeachers.forEach((t) => notifiedIds.add(t.id));
        } else {
          const allTeachers = allUsers.filter(
            (u) => u.role === "Teacher" && u.id !== exam.teacher_id
          );
          allTeachers.forEach((t) => notifiedIds.add(t.id));
        }

        const notifications = [];
        notifiedIds.forEach((userId) => {
          notifications.push({
            id: uuidv4(),
            user_id: userId,
            type: "submission",
            title: "Nouvelle copie soumise",
            message: `${student ? student.name + " " + student.surname : "Un étudiant"} a soumis sa copie pour "${exam.title}"`,
            link: `/examinations/submissions/${exam_id}`,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        });

        if (notifications.length > 0) {
          // Insert one by one
          for (const notif of notifications) {
            await db.insert("notifications", notif);
          }
        }
      }

      res.status(201).json(created);
    } catch (error) {
      console.error("Erreur soumission:", error);
      res.status(500).json({ error: "Erreur lors de la soumission" });
    }
  });
});

// Soumissions par épreuve
server.get("/api/submissions/exam/:examId", async (req, res) => {
  try {
    const examId = req.params.examId;
    const allSubmissions = await db.getAll("submissions");
    const filtered = allSubmissions.filter((s) => s.exam_id === examId);
    const users = await db.getAll("users");
    const enriched = filtered.map((sub) => {
      const student = users.find((u) => u.id === sub.student_id);
      return { ...sub, student_name: student ? `${student.name} ${student.surname}` : "Inconnu" };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Soumissions pour un enseignant
server.get("/api/submissions/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const allUsers = await db.getAll("users");
    const teacher = allUsers.find((u) => u.id === teacherId);
    const teacherBranch = teacher?.brancnId;

    const allExams = await db.getAll("exams");
    let exams = allExams.filter(
      (e) =>
        e.teacher_id === teacherId ||
        (teacherBranch && e.branch_id === teacherBranch) ||
        !e.branch_id
    );
    const examIds = [...new Set(exams.map((e) => e.id))];

    const allSubmissions = await db.getAll("submissions");
    const submissions = allSubmissions
      .filter((s) => examIds.includes(s.exam_id))
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

    const enriched = submissions.map((sub) => {
      const student = allUsers.find((u) => u.id === sub.student_id);
      const exam = exams.find((e) => e.id === sub.exam_id);
      return {
        ...sub,
        student_name: student ? `${student.name} ${student.surname}` : "Inconnu",
        exam_title: exam ? exam.title : "Épreuve inconnue",
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Soumissions pour un parent
server.get("/api/submissions/parent/:parentId", async (req, res) => {
  try {
    const parentId = req.params.parentId;
    const allUsers = await db.getAll("users");
    const parent = allUsers.find((u) => u.id === parentId);

    if (!parent || !parent.studentArrayId || parent.studentArrayId.length === 0) {
      return res.json([]);
    }

    const childIds = parent.studentArrayId;
    const allSubmissions = await db.getAll("submissions");
    const submissions = allSubmissions
      .filter((s) => childIds.includes(s.student_id) && s.grade !== null && s.grade !== undefined)
      .sort((a, b) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime());

    const allExams = await db.getAll("exams");
    const enriched = submissions.map((sub) => {
      const exam = allExams.find((e) => e.id === sub.exam_id);
      const student = allUsers.find((u) => u.id === sub.student_id);
      return {
        ...sub,
        exam_title: exam ? exam.title : "Épreuve inconnue",
        exam_due_date: exam ? exam.due_date : null,
        student_name: student ? `${student.name} ${student.surname}` : "Inconnu",
        is_late: exam && exam.due_date ? new Date(sub.submitted_at) > new Date(exam.due_date) : false,
      };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Soumissions d'un étudiant
server.get("/api/submissions/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const allSubmissions = await db.getAll("submissions");
    const filtered = allSubmissions.filter((s) => s.student_id === studentId);
    const allExams = await db.getAll("exams");
    const enriched = filtered.map((sub) => {
      const exam = allExams.find((e) => e.id === sub.exam_id);
      return { ...sub, exam_title: exam ? exam.title : "Épreuve inconnue" };
    });
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Noter une soumission
server.patch("/api/submissions/:id/grade", async (req, res) => {
  try {
    const subId = req.params.id;
    const { grade, comment, graded_by } = req.body;
    const submission = await db.getById("submissions", subId);

    if (!submission) return res.status(404).json({ error: "Soumission non trouvée" });

    const updated = await db.updateById("submissions", subId, {
      grade: grade !== undefined ? grade : submission.grade,
      comment: comment !== undefined ? comment : submission.comment,
      graded_by: graded_by || submission.graded_by,
      graded_at: new Date().toISOString(),
    });

    // Notification à l'étudiant
    const allExams = await db.getAll("exams");
    const exam = allExams.find((e) => e.id === updated.exam_id);
    const allUsers = await db.getAll("users");

    // Notifier l'étudiant
    await db.insert("notifications", {
      id: uuidv4(),
      user_id: updated.student_id,
      type: "grade",
      title: "Copie notée",
      message: `Votre copie pour "${exam ? exam.title : "l'épreuve"}" a reçu la note de ${grade}/20`,
      link: "/quiz/results",
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // Notifier les parents
    const parents = allUsers.filter(
      (u) => u.role === "Parent" && u.studentArrayId && u.studentArrayId.includes(updated.student_id)
    );
    for (const parent of parents) {
      await db.insert("notifications", {
        id: uuidv4(),
        user_id: parent.id,
        type: "grade",
        title: "Copie notée - Résultat disponible",
        message: `La copie de votre enfant pour "${exam ? exam.title : "l'épreuve"}" a été notée : ${grade}/20`,
        link: "/quiz/results",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Erreur notation:", error);
    res.status(500).json({ error: "Erreur lors de la notation" });
  }
});

// ══════════════════════════════════════════
// NOTIFICATIONS ROUTES
// ══════════════════════════════════════════

// Obtenir les notifications
server.get("/api/notifications/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allNotifs = await db.getAll("notifications");
    const filtered = allNotifs
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Marquer une notification comme lue
server.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const notifId = req.params.id;
    const notif = await db.getById("notifications", notifId);
    if (!notif) return res.status(404).json({ error: "Notification non trouvée" });
    const updated = await db.updateById("notifications", notifId, { is_read: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Marquer toutes les notifications comme lues
server.post("/api/notifications/:userId/read-all", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allNotifs = await db.getAll("notifications");
    for (const notif of allNotifs) {
      if (notif.user_id === userId && !notif.is_read) {
        await db.updateById("notifications", notif.id, { is_read: true });
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Nombre de notifications non lues
server.get("/api/notifications/:userId/unread-count", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allNotifs = await db.getAll("notifications");
    const count = allNotifs.filter((n) => n.user_id === userId && !n.is_read).length;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// ══════════════════════════════════════════
// STATISTIQUES
// ══════════════════════════════════════════

// Stats pour un quiz
server.get("/api/stats/quiz/:quizId", async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const allResults = await db.getAll("results");
    const results = allResults.filter((r) => r.quizId === quizId && r.status === "complete");
    const allQuiz = await db.getAll("quiz");
    const quiz = allQuiz.find((q) => q.id === quizId);

    if (results.length === 0) {
      return res.json({
        quizId,
        quizName: quiz ? quiz.name : "",
        totalStudents: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        passRate: 0,
        scoreDistribution: [],
      });
    }

    const scores = results.map((r) => r.percent || 0);
    const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const passCount = scores.filter((s) => s >= 50).length;
    const passRate = Math.round((passCount / scores.length) * 100);

    const ranges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ];
    const scoreDistribution = ranges.map((r) => ({
      range: r.range,
      count: scores.filter((s) => s >= r.min && s <= r.max).length,
    }));

    res.json({
      quizId,
      quizName: quiz ? quiz.name : "",
      totalStudents: results.length,
      average,
      highest,
      lowest,
      passRate,
      scoreDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Stats pour un enseignant
server.get("/api/stats/teacher/:teacherId", async (req, res) => {
  try {
    const teacherId = req.params.teacherId;
    const allUsers = await db.getAll("users");
    const teacher = allUsers.find((u) => u.id === teacherId);
    const teacherBranch = teacher?.brancnId;

    const allQuiz = await db.getAll("quiz");
    let quizzes = allQuiz.filter(
      (q) =>
        q.authorId === teacherId ||
        (teacherBranch && q.branchId && q.branchId.includes(teacherBranch))
    );
    const uniqueQuizzes = [...new Map(quizzes.map((q) => [q.id, q])).values()];
    const quizIds = new Set(uniqueQuizzes.map((q) => q.id));

    const allResults = await db.getAll("results");
    const results = allResults.filter((r) => quizIds.has(r.quizId) && r.status === "complete");

    const scores = results.map((r) => r.percent || 0);
    const averageScore = results.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const ranges = [
      { range: "0-20%", min: 0, max: 20 },
      { range: "21-40%", min: 21, max: 40 },
      { range: "41-60%", min: 41, max: 60 },
      { range: "61-80%", min: 61, max: 80 },
      { range: "81-100%", min: 81, max: 100 },
    ];
    const scoreDistribution = ranges.map((r) => ({
      range: r.range,
      count: scores.filter((s) => s >= r.min && s <= r.max).length,
    }));

    res.json({
      totalQuizzes: uniqueQuizzes.length,
      totalSubmissions: results.length,
      totalStudents: new Set(results.map((r) => r.studentId)).size,
      averageScore,
      scoreDistribution,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// Stats pour un étudiant
server.get("/api/stats/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const allResults = await db.getAll("results");
    const results = allResults.filter(
      (r) => r.studentId === studentId && r.status === "complete"
    );

    const performance = results
      .map((r) => ({
        name: r.name,
        score: r.percent || 0,
        date: r.completedAt || r.createAt,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      totalQuizzes: results.length,
      averageScore:
        results.length > 0
          ? Math.round(results.reduce((a, r) => a + (r.percent || 0), 0) / results.length)
          : 0,
      bestScore: results.length > 0 ? Math.max(...results.map((r) => r.percent || 0)) : 0,
      performance,
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur" });
  }
});

// ══════════════════════════════════════════
// PV (PROCÈS-VERBAL)
// ══════════════════════════════════════════

server.get("/api/pv/quiz/:quizId/:authorId", async (req, res) => {
  try {
    const { quizId, authorId } = req.params;

    const allUsers = await db.getAll("users");
    const requestingUser = allUsers.find((u) => u.id === authorId);
    if (!requestingUser) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const allQuiz = await db.getAll("quiz");
    const quiz = allQuiz.find((q) => q.id === quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz non trouvé" });
    }

    const isAdmin = requestingUser.role === "Administrateur";
    const isOwner = quiz.authorId === authorId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Vous n'êtes pas autorisé à générer le PV pour ce quiz" });
    }

    const allResults = await db.getAll("results");
    const quizResults = allResults.filter((r) => r.quizId === quizId && r.status === "complete");

    const studentsWithResults = quizResults
      .map((r) => {
        const student = allUsers.find((u) => u.id === r.studentId);
        return {
          studentId: r.studentId,
          studentName: student ? `${student.name} ${student.surname}` : "Inconnu",
          score: r.score || "0/0",
          percent: r.percent || 0,
          feedback: r.feedback || "Non acquis",
          createAt: r.createAt || r.create_At,
          decision: (r.percent || 0) >= 50 ? "Admis" : "Ajourné",
        };
      })
      .sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        return a.studentName.localeCompare(b.studentName);
      });

    const totalStudents = studentsWithResults.length;
    const percents = studentsWithResults.map((s) => s.percent);
    const average = totalStudents > 0
      ? Math.round(percents.reduce((a, b) => a + b, 0) / totalStudents)
      : 0;
    const bestScore = totalStudents > 0 ? Math.max(...percents) : 0;
    const lowestScore = totalStudents > 0 ? Math.min(...percents) : 0;
    const admittedCount = studentsWithResults.filter((s) => s.decision === "Admis").length;
    const failedCount = studentsWithResults.filter((s) => s.decision === "Ajourné").length;
    const successRate = totalStudents > 0
      ? Math.round((admittedCount / totalStudents) * 100)
      : 0;

    const distributionRanges = [
      { label: "Excellent (80-100%)", min: 80, max: 101 },
      { label: "Bien (60-79%)", min: 60, max: 80 },
      { label: "Passable (40-59%)", min: 40, max: 60 },
      { label: "Faible (20-39%)", min: 20, max: 40 },
      { label: "Insuffisant (0-19%)", min: 0, max: 20 },
    ];
    const distribution = distributionRanges.map((r) => ({
      range: r.label,
      count: percents.filter((p) => p >= r.min && p < r.max).length,
    }));

    const pvData = {
      institution: "CortexEdu University",
      session: new Date().toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
      }),
      generatedAt: new Date().toISOString(),
      quiz: {
        id: quiz.id,
        name: quiz.name,
        description: quiz.description || "",
        startDate: quiz.startDate,
        endDate: quiz.endDate,
        typeOfTime: quiz.typeOfTime,
        totalQuestions: quiz.quizQuestions?.length || 0,
        totalMarks: quiz.quizQuestions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0,
      },
      students: studentsWithResults,
      stats: {
        totalStudents,
        submittedCount: totalStudents,
        averagePercent: average,
        bestScore,
        lowestScore,
        admittedCount,
        failedCount,
        successRate,
        distribution,
      },
    };

    res.json(pvData);
  } catch (error) {
    console.error("Erreur génération PV:", error);
    res.status(500).json({ error: "Erreur lors de la génération du PV" });
  }
});

// ══════════════════════════════════════════
// MOT DE PASSE OUBLIÉ
// ══════════════════════════════════════════

// Demander un code de réinitialisation
server.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const allUsers = await db.getAll("users");
    const user = allUsers.find((u) => u.mail === email);

    if (!user) {
      return res.json({
        success: true,
        message: "Si cet email existe, un code vous a été envoyé.",
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.updateById("users", user.id, { resetCode, resetCodeExpires });

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Réinitialisation de votre mot de passe CortexEdu",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h1 style="color: #00E5FF; font-size: 24px; margin-bottom: 16px;">CortexEdu</h1>
            <p style="color: #333; font-size: 16px;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p style="color: #333; font-size: 16px;">Voici votre code de réinitialisation :</p>
            <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #7C5CFF; letter-spacing: 8px;">${resetCode}</span>
            </div>
            <p style="color: #666; font-size: 14px;">Ce code expire dans 15 minutes.</p>
            <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Erreur envoi email:", emailError);
      if (process.env.NODE_ENV !== "production") {
        return res.json({
          success: true,
          devCode: resetCode,
          message: "Code de réinitialisation généré (mode développement).",
        });
      }
    }

    res.json({
      success: true,
      message: "Si cet email existe, un code vous a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur forgot-password:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Réinitialiser le mot de passe
server.post("/api/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code et nouveau mot de passe requis" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    const allUsers = await db.getAll("users");
    const user = allUsers.find((u) => u.mail === email);

    if (!user || user.resetCode !== code) {
      return res.status(400).json({ error: "Code invalide ou expiré" });
    }

    if (user.resetCodeExpires && new Date(user.resetCodeExpires) < new Date()) {
      return res.status(400).json({ error: "Le code a expiré. Veuillez refaire une demande." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.updateById("users", user.id, {
      password: passwordHash,
      resetCode: null,
      resetCodeExpires: null,
    });

    res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("Erreur reset-password:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ══════════════════════════════════════════
// SERVEUR STATIQUE pour uploads
// ══════════════════════════════════════════

// En production, servir les fichiers depuis Supabase Storage URLs
// Pas besoin de serveur statique local

// ══════════════════════════════════════════
// DÉMARRAGE
// ══════════════════════════════════════════

server.listen(port, () => {
  console.log(`✅ Serveur CortexEdu démarré sur http://localhost:${port}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Supabase: https://hxzioeulmegkmgyqqwio.supabase.co`);
});
