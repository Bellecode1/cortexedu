const { supabase } = require("./supabase");

/**
 * Helper pour remplacer les appels lowdb (router.db.get) par des appels Supabase.
 * 
 * Avant : router.db.get("users").value()
 * Après : await db.getAll("users")
 * 
 * Avant : router.db.get("users").find({ id: "123" }).value()
 * Après : await db.getById("users", "123")
 * 
 * Avant : router.db.get("users").push(newUser).write()
 * Après : await db.insert("users", newUser)
 * 
 * Avant : router.db.get("users").splice(index, 1, updated).write()
 * Après : await db.updateById("users", id, updated)
 *                ou await db.splice("users", index, 1, updated)
 */

const db = {
  // Récupérer tous les enregistrements d'une table
  async getAll(table) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw error;
    return data || [];
  },

  // Récupérer un enregistrement par ID
  async getById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  // Récupérer des enregistrements avec un filtre simple (champ = valeur)
  async getWhere(table, field, value) {
    if (value === undefined || value === null) {
      return this.getAll(table);
    }
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(field, value);
    if (error) throw error;
    return data || [];
  },

  // Récupérer des enregistrements avec plusieurs filtres (objet { champ: valeur })
  async getWhereMany(table, filters) {
    let query = supabase.from(table).select("*");
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(field, value);
      }
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Récupérer le premier enregistrement correspondant aux filtres
  async findOne(table, filters) {
    let query = supabase.from(table).select("*");
    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(field, value);
      }
    }
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  // Insérer un nouvel enregistrement
  async insert(table, record) {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Insérer plusieurs enregistrements
  async insertMany(table, records) {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select();
    if (error) throw error;
    return data || [];
  },

  // Mettre à jour un enregistrement par ID
  async updateById(table, id, updates) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Mettre à jour des enregistrements correspondant à un filtre
  async updateWhere(table, field, value, updates) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(field, value)
      .select();
    if (error) throw error;
    return data || [];
  },

  // Supprimer un enregistrement par ID
  async deleteById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .select();
    if (error) throw error;
    return data?.[0] || null;
  },

  // Supprimer des enregistrements correspondant à un filtre
  async deleteWhere(table, field, value) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq(field, value)
      .select();
    if (error) throw error;
    return data || [];
  },

  // Compter les enregistrements
  async count(table, field, value) {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (field && value !== undefined) {
      query = query.eq(field, value);
    }
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  // Récupérer avec pagination
  async getPaginated(table, { page = 1, pageSize = 10, filters = {} }) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select("*", { count: "exact" });

    for (const [field, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        query = query.eq(field, value);
      }
    }

    const { data, count, error } = await query
      .range(from, to)
      .order("id", { ascending: true });

    if (error) throw error;
    return {
      data: data || [],
      totalCount: count || 0,
      page: parseInt(page),
    };
  },

  // Filtrer en mémoire (pour les filtres complexes qu'on ne peut pas exprimer en Supabase)
  filterInMemory(data, predicate) {
    return data.filter(predicate);
  },

  // Trouver dans un tableau en mémoire
  findInMemory(data, predicate) {
    return data.find(predicate);
  },

  // Mapping spécial pour les champs JSONB
  // Supabase retourne les JSONB automatiquement comme des objets JS
};

module.exports = db;
