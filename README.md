# Uncord

[![Node.js CI](https://github.com/philipodev/uncord/actions/workflows/build.yml/badge.svg)](https://github.com/philipodev/uncord/actions/workflows/build.yml)

A discord bot framework built in typescript for the modern era.

## Features

- Controllers
- Dependency Injection
- Slash Commands
- Button Interactions

## Getting started

### Prere

- Node `16.6.0` and later

### Install uncord

`npm install --save uncord` <br/> or
`yarn add uncord`

### First bot

```typescript
// index.ts

import { Bot } from 'uncord'
import { ExampleController } from './controllers/ExampleController'

main()
  .catch((e) => console.error(e))

async function main() {
  const bot = new Bot(DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID)
    .addControllers([
      ExampleController
    ]))

  await bot.start()
}

```

```typescript
// ./controllers/ExampleController

import { ICommandController, Controller, CommandBuilder } from 'uncord'
import { CommandInteraction } from 'discord.js'

@Controller()
@CommandBuilder("example", "An example command") // this will register the slash command /example
export class ExampleController implments ICommandController {
  async run(interaction: CommandInteraction){
    await interaction.reply("Hello Discord")
  }
}

```