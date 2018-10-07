import moment from 'moment';
import crypto from 'crypto';
import md5 from 'md5-hex'
import {oncePerServices, missingService} from '../../common/services/index';

function apolloToRelayResolverAdapter(oldResolver) {
  return function (obj, args, context) {
    return oldResolver(args, context.request);
  }
}

export default oncePerServices(function (services) {

    const {
        postgres = missingService('postgres')
    } = services;

    function staticQuery(builderContext,query) {
      return async function(obj, args, context) {
        const sqlargs = {statement:query}
        let returnData = {};
        await postgres.exec(sqlargs).then(
          (result)=>{
            returnData = result.rows.map(
              (row)=>{
                return{
                  id:row.user_id,
                  login: row.login,
                  email: row.email,
                  name: row.name,
                  manager: !row.manager?false:true,
                  blocked: !row.blocked?false:true,
                  data: row.data
                }
              });
          });
        return returnData
      };
    }

    function findQuery(builderContext) {
      return async function(obj, args, context) {
        const sqlargs = {
          statement:"SELECT * FROM public.users WHERE (name LIKE '%'|| $1::text ||'%') OR (login LIKE '%'|| $1::text ||'%')",
          params:[args["substring"]]
        }
        let returnData = {};
        await postgres.exec(sqlargs).then(
          (result)=>{
            returnData = result.rows.map(
              (row)=>{
                return{
                  id:row.user_id,
                  login: row.login,
                  email: row.email,
                  name: row.name,
                  manager: !row.manager?false:true,
                  blocked: !row.blocked?false:true,
                  data: row.data
                }
              });
          });
        return returnData
      };
    }

    function authMutation(builderContext) {
      return async function(obj, args, context) {
        const sqlargs = {
          statement:"SELECT user_id, name FROM public.users WHERE login LIKE $1::text AND password_hash LIKE $2::text",
          params:[args["login"],md5(args["password"])]
        }
        let returnData = {};
        await postgres.exec(sqlargs).then(
          (result)=>{
            if(!result.rows.length)
              returnData = "login or password is incorrect";
            else
              returnData = "login successful! Hi "+result.rows[0].name;
          }
      );
        return returnData
      }
  }

  return {
    staticQuery,
    findQuery,
    authMutation
  }
});
