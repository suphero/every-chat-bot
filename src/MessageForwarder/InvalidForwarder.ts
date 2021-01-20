import { MessageForwarderBase } from './MessageForwarderBase';

export class InvalidForwarder extends MessageForwarderBase {
  async _forward(_opponentChatId: number) {
    await this.telegramHandler.sendMessage(this.chatId, 'Unsupported message');
  }
}