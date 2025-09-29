const appModules = [
  {
    "name": "Run Opcode",
    "type": "opcodes",
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
      },
      {
        "domain": "Account Management",
        "examples": [
          {
            "task": "Find Accounts",
            "opcode": "PCM_OP_SEARCH",
            "flag": "0",
            "flist": "0 PIN_FLD_POID           POID [0] 0.0.0.1 /search -1 0\n0 PIN_FLD_FLAGS           INT [0] 0\n0 PIN_FLD_TEMPLATE        STR [0] \"select X from /account where F1 like V1 \"\n0 PIN_FLD_ARGS          ARRAY [1]\n1     PIN_FLD_ACCOUNT_NO     STR [0] \"123%\"\n0 PIN_FLD_RESULTS       ARRAY [0]\n1     PIN_FLD_POID           POID [0] NULL"
          }
        ]
      }
    ]
  },
  {
    "name": "Quick SQL",
    "type": "sql",
    "domains": [
      {
        "domain": "Accounts",
        "examples": [
          {
            "task": "Recent Active Accounts",
            "sql": "SELECT * FROM (SELECT a.poid_id0, a.account_no, a.name, a.currency, a.created_t FROM account_t a WHERE a.status = 10100 ORDER BY a.created_t DESC) WHERE ROWNUM <= 20;"
          }
        ]
      },
      {
        "domain": "Billing",
        "examples": [
          {
            "task": "Recent Bills",
            "sql": "SELECT * FROM (SELECT b.poid_id0, b.account_obj_id0, b.due_t, b.total_due FROM bill_t b ORDER BY b.due_t DESC) WHERE ROWNUM <= 10;"
          }
        ]
      }
    ]
  }
];

// Merge with custom examples if available
if (typeof customAppModules !== 'undefined' && Array.isArray(customAppModules)) {
  // First, collect all opcodes modules (built-in and custom)
  const allOpcodesModules = appModules.filter(m => m.type === 'opcodes').concat(
    customAppModules.filter(m => m.type === 'opcodes')
  );

  // Merge all opcodes domains into a single "Opcodes" module
  if (allOpcodesModules.length > 0) {
    const mergedOpcodesModule = {
      "name": "Run Opcode",
      "type": "opcodes",
      "domains": []
    };

    // Collect all domains from all opcodes modules
    const allDomains = [];
    allOpcodesModules.forEach(module => {
      if (module.domains) {
        allDomains.push(...module.domains);
      }
    });

    // Merge domains by name
    const domainMap = new Map();
    allDomains.forEach(domain => {
      if (domainMap.has(domain.domain)) {
        // Merge examples
        const existing = domainMap.get(domain.domain);
        if (domain.examples) {
          existing.examples = existing.examples.concat(domain.examples);
        }
      } else {
        domainMap.set(domain.domain, { ...domain });
      }
    });

    mergedOpcodesModule.domains = Array.from(domainMap.values());

    // Replace or add the merged opcodes module
    const existingOpcodesIndex = appModules.findIndex(m => m.type === 'opcodes');
    if (existingOpcodesIndex >= 0) {
      appModules[existingOpcodesIndex] = mergedOpcodesModule;
    } else {
      appModules.push(mergedOpcodesModule);
    }
  }

  // Handle SQL modules: merge or add
  const allSqlModules = appModules.filter(m => m.type === 'sql').concat(
    customAppModules.filter(m => m.type === 'sql')
  );

  if (allSqlModules.length > 0) {
    const mergedSqlModule = {
      "name": "Quick SQL",
      "type": "sql",
      "domains": []
    };

    const allSqlDomains = [];
    allSqlModules.forEach(module => {
      if (module.domains) {
        allSqlDomains.push(...module.domains);
      }
    });

    const sqlDomainMap = new Map();
    allSqlDomains.forEach(domain => {
      if (sqlDomainMap.has(domain.domain)) {
        const existing = sqlDomainMap.get(domain.domain);
        if (domain.examples) {
          existing.examples = existing.examples.concat(domain.examples);
        }
      } else {
        sqlDomainMap.set(domain.domain, { ...domain });
      }
    });

    mergedSqlModule.domains = Array.from(sqlDomainMap.values());

    const existingSqlIndex = appModules.findIndex(m => m.type === 'sql');
    if (existingSqlIndex >= 0) {
      appModules[existingSqlIndex] = mergedSqlModule;
    } else {
      appModules.push(mergedSqlModule);
    }
  }

  // Handle UI modules: merge or add
  customAppModules.filter(m => m.type === 'ui').forEach(customModule => {
    const existingModule = appModules.find(m => m.name === customModule.name && m.type === 'ui');
    if (existingModule) {
      // Override content
      existingModule.content = customModule.content;
    } else {
      // Add new UI module
      appModules.push(customModule);
    }
  });
}
