import User from '../../models/User.model';
export default {
  findAll: (q) => User.find(q).limit(100),
  findById: (id) => User.findById(id),
  create: (body) => User.create(body),
  update: (id, body) => User.findByIdAndUpdate(id, body, { new: true }),
  delete: (id) => User.findByIdAndDelete(id)
};
