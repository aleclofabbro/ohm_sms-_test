import { Context } from "mingo/core";
import { $eq } from "mingo/operators/expression/comparison";
import { $match /* , $count */ } from "mingo/operators/pipeline";
import type { AnyObject } from 'mingo/types';
import * as ohm from 'ohm-js';
import grammar from './assets/grammar.ohm-bundle';
// import specs from './openapi.json'
function log(t:string[], args:Record<string,ohm.Node>){
  console.log('[',...t,']\n', ...Object.entries(args).map(([name, node])=>`${name}: ${node.sourceString}`), '\n','-'.repeat(100), '\n')
  // Object.values(args).forEach(_=>_.gm())
}
export function gm(query:string):AnyObject[] {
  const context = Context.init({
    pipeline: {  $match },
    expression: { $eq }
  })
  const stack: AnyObject[] = [] 
  const targetStack: string[] = [] 
  const pipeline: AnyObject[] = []
  const semantics = grammar.createSemantics().addOperation('gm()',{
    SetOp: (_SetOp,dotPath,_colon,jsonString,) => {
      log(['SetOp'],{_SetOp,dotPath,_colon,jsonString})
      jsonString.gm()
    },
    AddOp: (_AddOp,b,c,) => {
      log(['AddOp'],{_AddOp,b,c})
    },
    AddSetOp: (_AddSetOp,b,c,) => {
      log(['AddSetOp'],{_AddSetOp,b,c})
    },
    RemoveOp: (_RemoveOp,b,c,d,e,) => {
      log(['RemoveOp'],{_RemoveOp,b,c,d,e})
    },
    NestedBlock: (target,statements,_UP,) => {
      log(['NestedBlock'],{ target,statements,_UP})
      targetStack.push(target.sourceString)
      statements.children.map(_=>_.gm())
      const popped = targetStack.pop()
      if(target.sourceString !== popped){
        throw new TypeError(`target !== popped: [${target.sourceString}] !== [${popped}]`)
      }
      
    },
    Query: (target, statements) => {
      log(['Query'],{target, statements})
      target.gm()
      statements.children.map(_=>_.gm())
      // const popped = target.pop()
      // if(target !== popped){
      //   throw new TypeError(`target !== popped: ${target} !== ${popped}`)
      // }
    },
    Target: (_ON, target, _par1, ids, _par2) => {
      log(['Target', target.sourceString],{ nextTargetIdent: target, ids })
      targetStack.push(target.sourceString)
    },
    ///
        jsonMock: (jsonString,) => {
      log(['jsonMock'],{jsonString})
      return JSON.parse(jsonString.sourceString)
    },
    // Statement: (statement,) => {
    //   log(['Statement'],{statement})
    
    //   statement.gm()
    // },
    // ident: (a,b,) => {
      //   log(['ident'],a,b)
    // },

  })
  const matchResult = grammar.match(query);
  const evalResult = semantics(matchResult).gm();
  return pipeline
  // return new Aggregator(pipeline, { context, processingMode:ProcessingMode.CLONE_OFF })
}
