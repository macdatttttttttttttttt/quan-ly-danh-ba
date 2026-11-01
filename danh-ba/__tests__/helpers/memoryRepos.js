// Repository giả lập trong bộ nhớ, có hành vi giống bản SQLite,
// dùng cho kiểm thử đơn vị tầng nghiệp vụ.

export class MemoryContactRepository {
  constructor() {
    this.rows = [];
    this.nextId = 1;
  }
  async findById(id) {
    const r = this.rows.find((c) => c.id === id);
    return r ? { ...r } : null;
  }
  async findActiveByPhone(phone, excludeId = null) {
    return this.rows.find((c) => !c.isDeleted && c.phone === phone && c.id !== excludeId) ?? null;
  }
  async findActive({ nameKeyword = '', phoneKeyword = '', groupId = null, favoritesOnly = false }) {
    return this.rows
      .filter((c) => !c.isDeleted)
      .filter((c) =>
        !nameKeyword && !phoneKeyword
          ? true
          : (nameKeyword && c.searchName.includes(nameKeyword)) || (phoneKeyword && c.phone.includes(phoneKeyword)),
      )
      .filter((c) => groupId == null || c.groupId === groupId)
      .filter((c) => !favoritesOnly || c.isFavorite)
      .sort((a, b) => a.searchName.localeCompare(b.searchName))
      .map((c) => ({ ...c }));
  }
  async findDeleted() {
    return this.rows.filter((c) => c.isDeleted).map((c) => ({ ...c }));
  }
  async insert(c) {
    const id = this.nextId++;
    this.rows.push({ ...c, id, isDeleted: false, deletedAt: null });
    return id;
  }
  async update(id, c) {
    Object.assign(this.rows.find((r) => r.id === id), c);
  }
  async setFavorite(id, value) {
    this.rows.find((r) => r.id === id).isFavorite = value;
  }
  async softDelete(id, at) {
    Object.assign(this.rows.find((r) => r.id === id), { isDeleted: true, deletedAt: at });
  }
  async restore(id) {
    Object.assign(this.rows.find((r) => r.id === id), { isDeleted: false, deletedAt: null });
  }
  async hardDelete(id) {
    this.rows = this.rows.filter((r) => r.id !== id);
  }
}

export class MemoryGroupRepository {
  constructor(contactRepo) {
    this.rows = [];
    this.nextId = 1;
    this.contactRepo = contactRepo;
  }
  async findAll() {
    return this.rows.map((g) => ({ ...g, contactCount: 0 }));
  }
  async findById(id) {
    return this.rows.find((g) => g.id === id) ?? null;
  }
  async findByName(name) {
    return this.rows.find((g) => g.name.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async insert(name) {
    const id = this.nextId++;
    this.rows.push({ id, name });
    return id;
  }
  async rename(id, name) {
    this.rows.find((g) => g.id === id).name = name;
  }
  async delete(id) {
    this.rows = this.rows.filter((g) => g.id !== id);
    for (const c of this.contactRepo?.rows ?? []) if (c.groupId === id) c.groupId = null;
  }
}

export class MemorySettingsRepository {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  async set(key, value) {
    this.map.set(key, value);
  }
}
