import { model, Schema, Model, Document } from 'mongoose';

export interface ILobby extends Document {
  chatId: number;
  languageCode: string;
}

const LobbySchema: Schema = new Schema({
  chatId: { type: Number, required: true, unique: true },
  languageCode: { type: String, required: true }
});

const Lobby: Model<ILobby> = model('Lobby', LobbySchema);
export default Lobby