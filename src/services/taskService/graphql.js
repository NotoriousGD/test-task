import {oncePerServices, missingService} from '../../common/services/index'

const PREFIX = '';

export default oncePerServices(function (services) {

  const graphqlBuilderSchema = require('../../common/graphql/LevelBuilder.schema');

  const resolvers = require('./resolvers').default(services);

  return async function builder(args) {

    graphqlBuilderSchema.build_options(args);
    const { parentLevelBuilder, typeDefs, builderContext } = args;

    typeDefs.push(`

      type UserData {
        birthday: String
      }

      type User {
        id: Int,
        login: String,
        name: String,
        email: String,
        manager: Boolean,
        blocked: Boolean,
        data: UserData
      }

    `);

    parentLevelBuilder.addQuery({
      name: `getAllUsers`,
      type: `[User]`,
      resolver: resolvers.staticQuery(builderContext,"SELECT * FROM public.users"),
    });

    parentLevelBuilder.addQuery({
      name: `getLockedUsers`,
      type: `[User]`,
      resolver: resolvers.staticQuery(builderContext,"SELECT * FROM public.users where blocked = true"),
    });

    parentLevelBuilder.addQuery({
      name: `getManagers`,
      type: `[User]`,
      resolver: resolvers.staticQuery(builderContext,"SELECT * FROM public.users where manager = true"),
    });

    parentLevelBuilder.addQuery({
      name: `findUsers`,
      type: `[User]`,
      args: `
        substring: String
      `,
      resolver: resolvers.findQuery(builderContext)
    });

    parentLevelBuilder.addMutation({
      name: 'auth',
      type: 'String',
      args:`
        login: String,
        password: String
      `,
      resolver: resolvers.authMutation(builderContext)
    });

  }
});
