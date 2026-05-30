'use strict';

/**
 * 受入・統合テスト用の最小 Firestore モック（devices / orgs / facilities / auditLogs）
 * @param {Record<string, Record<string, object>>} [seed] collectionName -> docId -> data
 */
function createMemoryFirestoreLedger(seed = {}) {
  /** @type {Record<string, Record<string, object>>} */
  const data = {};
  for (const [coll, docs] of Object.entries(seed)) {
    data[coll] = { ...docs };
  }

  function ensureColl(name) {
    if (!data[name]) data[name] = {};
  }

  function docSnap(coll, id) {
    const row = data[coll]?.[id];
    return {
      id,
      exists: row != null,
      data: () => (row != null ? { ...row } : undefined),
      ref: { id, _coll: coll },
    };
  }

  function querySnap(coll, ids) {
    const docs = ids.map((id) => docSnap(coll, id));
    return {
      empty: docs.length === 0,
      docs,
      forEach(fn) {
        docs.forEach(fn);
      },
    };
  }

  function makeDocRef(coll, id) {
    return {
      id,
      _coll: coll,
      async get() {
        return docSnap(coll, id);
      },
      async set(row, opts) {
        ensureColl(coll);
        const prev = data[coll][id] || {};
        data[coll][id] = opts?.merge ? { ...prev, ...row } : { ...row };
      },
      async update(patch) {
        ensureColl(coll);
        const prev = data[coll][id] || {};
        data[coll][id] = { ...prev, ...patch };
      },
    };
  }

  function filterDocs(coll, filters) {
    ensureColl(coll);
    return Object.keys(data[coll]).filter((id) => {
      const row = data[coll][id];
      return filters.every((f) => row[f.field] === f.value);
    });
  }

  function makeCollectionRef(coll) {
    return {
      doc(id) {
        return makeDocRef(coll, id);
      },
      where(field, op, value) {
        const filters = [{ field, op, value }];
        const chain = {
          where(f, o, v) {
            filters.push({ field: f, op: o, value: v });
            return chain;
          },
          limit() {
            return chain;
          },
          async get() {
            const ids = filterDocs(
              coll,
              filters.filter((x) => x.op === '=='),
            );
            return querySnap(coll, ids);
          },
        };
        return chain;
      },
      async get() {
        ensureColl(coll);
        return querySnap(coll, Object.keys(data[coll]));
      },
      add: async () => ({}),
    };
  }

  const db = {
    collection: (name) => makeCollectionRef(name),
    batch() {
      const ops = [];
      return {
        set(ref, row) {
          ops.push(async () => {
            await makeDocRef(ref._coll, ref.id).set(row);
          });
        },
        update(ref, patch) {
          ops.push(async () => {
            await makeDocRef(ref._coll, ref.id).update(patch);
          });
        },
        async commit() {
          for (const op of ops) await op();
        },
      };
    },
    /** @returns {Record<string, Record<string, object>>} */
    dump() {
      return data;
    },
  };

  return db;
}

/**
 * jest.mock('firebase-admin/firestore') 用ファクトリ
 * @param {ReturnType<typeof createMemoryFirestoreLedger>} db
 */
function firestoreModuleFactory(db) {
  return {
    getFirestore: () => db,
    FieldValue: {
      delete: () => Symbol.for('field-delete'),
    },
  };
}

module.exports = { createMemoryFirestoreLedger, firestoreModuleFactory };
