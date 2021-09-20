import { CommandInteraction } from 'discord.js'

export interface ICommandController {
  run(interaction: CommandInteraction): Promise<void>
}
