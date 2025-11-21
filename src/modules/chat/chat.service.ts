import Repository from './chat.repository';
class Service {
  async index(req) { return Repository.findAll(req.query || {}); }
  async get(id) { return Repository.findById(id); }
  async create(body, req) { return Repository.create(body); }
  async update(id, body) { return Repository.update(id, body); }
  async remove(id) { return Repository.delete(id); }
}
export default new Service();
