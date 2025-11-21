import Model from '../../models/Requirement.model';
export default {
  findAll: (q)=> Model.find(q).limit(100),
  findById: (id)=> Model.findById(id),
  create: (body)=> Model.create(body),
  update: (id, body)=> Model.findByIdAndUpdate(id, body, { new: true }),
  delete: (id)=> Model.findByIdAndDelete(id)
};
