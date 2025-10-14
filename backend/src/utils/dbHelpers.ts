import mongoose from 'mongoose';

/**
 * Safely find a document by id. Returns null if id is not a valid ObjectId or if the document is not found.
 * This prevents Mongoose CastError when callers accidentally pass guest ids or malformed ids.
 */
export async function safeFindById(Model: any, id?: any) {
  if (!id) return null;
  const idStr = String(id);
  if (!mongoose.isValidObjectId(idStr)) return null;
  try {
    return await Model.findById(idStr);
  } catch (err) {
    return null;
  }
}

export default { safeFindById };
