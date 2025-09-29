// Custom Module Examples
// This file allows users to add your own module examples without modifying the built-in examples.
// The examples defined here will be merged with the built-in examples in module_examples.js.
//
// To add custom examples, define additional modules in the customAppModules array.
// Each module should follow the same structure as in module_examples.js.
//
// Example structure:
/*
const customAppModules = [
  {
    "name": "My Custom Opcodes",
    "type": "opcodes",
    "domains": [
      {
        "domain": "My Domain",
        "examples": [
          {
            "task": "My Custom Task",
            "opcode": "PCM_OP_MY_CUSTOM",
            "flag": "0",
            "flist": "0 PIN_FLD_POID POID [0] 0.0.0.1 /account 1 0"
          }
        ]
      }
    ]
  },
  {
    "name": "My Custom SQL",
    "type": "sql",
    "domains": [
      {
        "domain": "Custom Domain",
        "examples": [
          {
            "task": "Custom Query",
            "sql": "SELECT SYSDATE FROM dual;"
          }
        ]
      }
    ]
  }
];
*/
//
// Modify the above example to add your custom module examples in the section below.
// The application will automatically merge these with the built-in examples.

const customAppModules = [
  // Add your custom modules here
];