import mongoose from 'mongoose';
import Chat, { IChat } from './models/Chat';
import Lobby, { ILobby } from './models/Lobby';
import User, { IUser } from './models/User';

export class DataHandler {
  public connect() {
    if (this.connected()) return;
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) return;
    return mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  private connected() {
    return mongoose.connection.readyState === 1;
  }

  public getUser(chatId: number): Promise<IUser> {
    return User.findOne({ chatId }).exec();
  }

  public addUser(chatId: number, languageCode: string): Promise<IUser> {
    return User.create({ chatId, languageCode });
  }

  public setLanguage(chatId: number, languageCode: string) {
    return User.updateOne(
      { chatId },
      { $set: { languageCode } },
      { upsert: true }
    ).exec();
  }

  public addToLobby(chatId: number, languageCode: string): Promise<ILobby> {
    return Lobby.create({ chatId, languageCode });
  }

  public findLobby(chatId: number) : Promise<ILobby>{
    return Lobby.findOne({ chatId }).exec();
  }

  public findOpponentInLobby(chatId: number, languageCode: string): Promise<ILobby> {
    return Lobby.findOne({ chatId: { $ne: chatId }, languageCode }).exec();
  }

  public leaveLobby(chatId: number) {
    return Lobby.deleteOne({ chatId }).exec();
  }

  public createChat(chatId1: number, chatId2: number, languageCode: string): Promise<IChat> {
    const chatIds = [chatId1, chatId2]
    return Chat.create({ chatIds, languageCode });
  }

  public findExistingChat(chatId: number): Promise<IChat> {
    return Chat.findOne({ chatIds: chatId }).exec();
  }

  public deleteChat(id: string) {
    return Chat.findByIdAndDelete(id).exec();
  }
}