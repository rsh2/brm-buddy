const opcodeExamples = {
  "domains": [
    {
      "domain": "Base Opcodes",
      "examples": [
        {
          "task": "Test Loopback",
          "opcode": "PCM_OP_TEST_LOOPBACK",
          "flag": "0",
          "flist": "0 PIN_FLD_POID            POID [0] 0.0.0.1 /account 1 0"
        },
        {
          "task": "Get Pin Virtual Time",
          "opcode": "PCM_OP_GET_PIN_VIRTUAL_TIME",
          "flag": "0",
          "flist": "0 PIN_FLD_POID           POID [0] 0.0.0.1 / 0 0"
        },
        {
          "task": "Read Object - Account",
          "opcode": "PCM_OP_READ_OBJ",
          "flag": "0",
          "flist": "0 PIN_FLD_POID            POID [0] 0.0.0.1 /account 1 0"
        },
        {
          "task": "Read Fields - Balance Group",
          "opcode": "PCM_OP_READ_FLDS",
          "flag": "0",
          "flist": "0 PIN_FLD_POID           POID [0] 0.0.0.1 /balance_group 1 0\n0 PIN_FLD_BALANCES      ARRAY [*] NULL"
        },
        {
          "task": "Search - 100 Latest Events for an Account",
          "opcode": "PCM_OP_SEARCH",
          "flag": "0",
          "flist": "0 PIN_FLD_POID           POID [0] 0.0.0.1 /search/pin -1 0\n0 PIN_FLD_FLAGS           INT [0] 256\n0 PIN_FLD_TEMPLATE        STR [0] \"select X from /event where F1 = V1 order by event_t.created_t desc \"\n0 PIN_FLD_ARGS          ARRAY [1]\n1     PIN_FLD_ACCOUNT_OBJ    POID [0] 0.0.0.1 /account 1 0\n0 PIN_FLD_RESULTS       ARRAY [100]\n1     PIN_FLD_POID           POID [0] NULL\n1     PIN_FLD_NAME            STR [0] NULL\n1     PIN_FLD_DESCR           STR [0] NULL\n1     PIN_FLD_SYS_DESCR       STR [0] NULL\n1     PIN_FLD_CREATED_T    TSTAMP [0] (0)"
        }
      ]
    },
    {
      "domain": "Balance FM Opcodes",
      "examples": [
        {
          "task": "Get Account contact and billinfo",
          "opcode": "PCM_OP_BAL_GET_ACCT_BILLINFO",
          "flag": "0",
          "flist": "0 PIN_FLD_POID           POID [0] 0.0.0.1 /account 1 0"
        }
      ]
    }
  ]
};

