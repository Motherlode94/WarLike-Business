import pathlib, sqlite3, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class SchemaTest(unittest.TestCase):
 def setUp(self):
  self.db=sqlite3.connect(':memory:')
  self.db.execute('PRAGMA foreign_keys=ON')
  scripts=list((ROOT/'migrations').glob('0001_*.sql'))
  self.assertEqual(len(scripts),1)
  self.db.executescript(scripts[0].read_text())
 def test_database_integrity(self):
  self.assertEqual(self.db.execute('PRAGMA integrity_check').fetchone()[0],'ok')
  self.assertEqual(self.db.execute('PRAGMA foreign_keys').fetchone()[0],1)
 def test_tables_exist(self):
  tables={x[0] for x in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
  if 'academy_courses' in tables:
   self.assertTrue({'academy_lessons','academy_progress','academy_enrollments'}<=tables)
   with self.assertRaises(sqlite3.IntegrityError):
    self.db.execute("INSERT INTO academy_progress(member_id,lesson_id,score) VALUES('other','missing',90)")
  else:
   self.assertTrue({'business_tenants','business_memberships','business_documents','business_payments','business_audit'}<=tables)
   with self.assertRaises(sqlite3.IntegrityError):
    self.db.execute("INSERT INTO business_documents(id,tenant_id,client_id,kind,status,subtotal_cents,tax_cents,total_cents,tax_snapshot_json,legal_snapshot_json) VALUES('d','t','c','invoice','draft',100,20,999,'{}','{}')")
if __name__=='__main__': unittest.main()
