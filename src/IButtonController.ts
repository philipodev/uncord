import { ButtonInteraction } from 'discord.js'

export interface IButtonController {
  run(interaction: ButtonInteraction, customId: string): Promise<void>
}
