import { UserModel } from "../../models";
import type { User, UpsertUser } from "@shared/models/auth";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id).lean();
    return doc ? toUser(doc) : undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const doc = await UserModel.findByIdAndUpdate(
      userData.id,
      {
        $set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
        },
        $setOnInsert: { _id: userData.id },
      },
      { upsert: true, new: true },
    ).lean();
    return toUser(doc!);
  }
}

function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    email: doc.email ?? null,
    firstName: doc.firstName ?? null,
    lastName: doc.lastName ?? null,
    profileImageUrl: doc.profileImageUrl ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export const authStorage = new AuthStorage();
