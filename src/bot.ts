import 'reflect-metadata'
import { SlashCommandBuilder } from '@discordjs/builders'
import {
  ButtonInteraction,
  Client,
  CommandInteraction,
  Intents,
  Interaction,
} from 'discord.js'
import { ICommandController } from './ICommandController'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import Container from 'typedi'
import { IButtonController } from './IButtonController'
import { IController } from './IController'

type ControllerClass = {
  // eslint-disable-next-line
  new (...args: any[]): IController
  slashCommandBuilder?: SlashCommandBuilder
  buttonAction?: string
}

export class Bot {
  private controllersMap: Map<string, ControllerClass>
  private client: Client
  private restClient: REST
  private initializers: (() => Promise<void>)[] = []

  constructor(
    private readonly token: string,
    private readonly clientId: string
  ) {
    this.client = new Client({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
    })
    this.restClient = new REST({ version: '9' }).setToken(this.token)

    this.setupContainer()
  }

  addControllers(controllers: ControllerClass[]): Bot {
    this.controllersMap = new Map()

    for (const controller of controllers) {
      let name: string
      if (controller.buttonAction) {
        name = controller.buttonAction
      } else {
        name = controller.slashCommandBuilder.name
      }

      this.controllersMap.set(name, controller)
    }

    return this
  }

  private setupContainer() {
    Container.set('discordClient', this.client)
    Container.set('discordRestClient', this.restClient)
  }

  getController<T = ICommandController>(name: string): T {
    const controllerClass = this.controllersMap.get(name)

    if (!controllerClass) return null

    return Container.get<T>(controllerClass)
  }

  addInitializer(promise: () => Promise<void>): Bot {
    this.initializers.push(promise)

    return this
  }

  private async runSecure(
    interaction: Interaction,
    fn: (interaction: Interaction) => void
  ) {
    try {
      fn(interaction)
    } catch (e) {
      console.error(e)
      if (interaction.isCommand()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply('Whoops... Something went wrong')
        }
      }
    }
  }

  async start(onReady?: VoidFunction): Promise<Bot> {
    await this.runInitializers().then(() => {
      this.setupContainer()
      this.login(onReady)
    })

    return this
  }

  async runInitializers(): Promise<void> {
    for (const initializer of this.initializers) {
      await initializer()
    }
  }

  async login(onReady?: VoidFunction): Promise<void> {
    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user.tag}!`)
      onReady && onReady()
    })

    await this.client.login(this.token)
    this.listenToSetup()
    this.listenToCommands()
  }

  private async onCommandInteraction(interaction: CommandInteraction) {
    const { commandName } = interaction

    if (!this.controllersMap) {
      console.error('No controllers has been added')
      return
    }

    if (!this.controllersMap.has(commandName)) {
      console.error('controller for this slash command not found')
      return
    }

    const controller = this.getController(commandName)
    await this.runSecure(interaction, (i) =>
      controller.run(i as CommandInteraction)
    )
  }

  private async onButtonInteraction(interaction: ButtonInteraction) {
    const { customId } = interaction
    const [name, ...customIds] = customId.split(':')

    const controller = this.getController<IButtonController>(name)
    if (controller) {
      await this.runSecure(interaction, (i) =>
        controller.run(i as ButtonInteraction, customIds.join(':'))
      )
    }
  }

  private async onInteractionCreate(interaction: Interaction) {
    if (interaction.isCommand())
      return await this.onCommandInteraction(interaction)

    if (interaction.isButton())
      return await this.onButtonInteraction(interaction)
  }

  private listenToCommands() {
    this.client.on('interactionCreate', (i) => this.onInteractionCreate(i))
  }

  private listenToSetup() {
    this.client.on('messageCreate', async (message) => {
      if (message.content === '!setup') {
        await this.createCommands(message.guild.id)
        await message.react('👍')
        await message.reply('Setup done')
      }
    })
  }

  private async createCommands(guildId: string) {
    const commands = [...this.controllersMap.values()]
      .filter((c) => !!c.slashCommandBuilder)
      .map((c) => c.slashCommandBuilder.toJSON())

    try {
      await this.restClient.put(
        Routes.applicationGuildCommands(this.clientId, guildId),
        { body: commands }
      )

      console.log('Successfully registered application commands.')
    } catch (e) {
      console.error(e)
    }
  }
}
