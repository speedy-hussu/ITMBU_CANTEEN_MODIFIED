import { FastifyRequest, FastifyReply } from "fastify";
import Item from "../../../database/models/item.model";

interface ItemBody {
  name: string;
  description?: string;
  price: number;
}

// GET /api/admin/items - Get all items
export const getItemsHandler = async (
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  const items = await Item.find().lean();
  return reply.send({ items });
};

// POST /api/admin/items - Create new item
export const createItemHandler = async (
  request: FastifyRequest<{ Body: ItemBody }>,
  reply: FastifyReply,
) => {
  const { name, description, price } = request.body;

  const item = new Item({
    name,
    description,
    price,
  });

  await item.save();
  return reply.status(201).send(item);
};

// PUT /api/admin/items/:id - Update item
export const updateItemHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<ItemBody> }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const update = request.body;

  const item = await Item.findByIdAndUpdate(id, update, { new: true });

  if (!item) {
    return reply.status(404).send({ message: "Item not found" });
  }

  return reply.send(item);
};

// DELETE /api/admin/items/:id - Delete item
export const deleteItemHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;

  const item = await Item.findByIdAndDelete(id);

  if (!item) {
    return reply.status(404).send({ message: "Item not found" });
  }

  return reply.send({ message: "Item deleted successfully" });
};
