import { SlashCommandBuilder } from '@discordjs/builders'
import { Service, Inject } from 'typedi'

// TODO: fix types here.
// eslint-disable-next-line
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
  return Service() as () => void
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

export function InjectClient(): ParameterDecorator {
  return Inject('discordClient') as ParameterDecorator
}

export function InjectRESTClient(): ParameterDecorator {
  return Inject('discordRestClient') as ParameterDecorator
}
