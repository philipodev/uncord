import { SlashCommandBuilder } from '@discordjs/builders'
import Container, { Service, Inject } from 'typedi'

export type CommandBuilderFunction = (command: SlashCommandBuilder) => any

export function CommandBuilder(
  name: string,
  description: string,
  fn?: CommandBuilderFunction
): ClassDecorator {
  return function (target) {
    let command = new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
    if (fn) command = fn(command)

    Object.defineProperty(target, 'slashCommandBuilder', {
      get() {
        return command
      },
    })
  }
}

export function Controller(): ClassDecorator {
  return Service() as any
}

export function ButtonController(name: string): ClassDecorator {
  return function (target) {
    Object.defineProperty(target, 'buttonAction', {
      get() {
        return name
      },
    })

    return Service()(target)
  }
}

export function Client(): Function {
  return Inject("discordClient")()
}

export function RESTClient(): Function {
  return Inject("discordRestClient")()
}