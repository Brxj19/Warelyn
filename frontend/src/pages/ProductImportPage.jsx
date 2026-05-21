import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CSVImportDropzone } from '../components/imports/CSVImportDropzone.jsx';
import { ImportPreviewTable } from '../components/imports/ImportPreviewTable.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import * as importService from '../services/importService.js';

const requiredColumns = ['name', 'sku', 'unit'];
const optionalColumns = ['barcode', 'description', 'category_name', 'brand_name', 'vendor_name', 'cost_price', 'selling_price', 'reorder_level', 'track_batch', 'track_expiry', 'track_serial', 'status'];

export function ProductImportPage() {
  const { accessToken } = useAuth();
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('create_only');
  const [createMissing, setCreateMissing] = useState(false);
  const [job, setJob] = useState(null);
  const [rows, setRows] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action) {
    setIsBusy(true);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setIsBusy(false);
    }
  }

  function upload() {
    if (!file) {
      setError('Choose a CSV file first.');
      return;
    }
    run(async () => {
      const response = await importService.uploadProductImport(accessToken, file, { mode, create_missing_references: createMissing });
      setJob(response.job);
      setRows(await importService.listProductImportRows(accessToken, response.job.id));
    });
  }

  function validate() {
    run(async () => {
      const response = await importService.validateProductImport(accessToken, job.id);
      setJob(response.job);
      setRows(response.rows);
    });
  }

  function commit() {
    run(async () => {
      const response = await importService.commitProductImport(accessToken, job.id);
      setJob(response.job);
      setRows(response.rows);
    });
  }

  const canCommit = job && ['VALIDATED', 'HAS_ERRORS'].includes(job.status) && job.valid_rows > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge tone="primary">CSV Import</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-warelyn-text">Import products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-warelyn-muted">Upload product master data with preview and validation. This does not import or mutate stock.</p>
        </div>
        <Link className="text-sm font-semibold text-warelyn-primary" to="/catalog/products">Back to products</Link>
      </div>
      {error ? <ErrorState description={error} /> : null}
      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">CSV Columns</h2></CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <div><p className="text-sm font-semibold text-warelyn-text">Required</p><p className="mt-2 text-sm text-warelyn-muted">{requiredColumns.join(', ')}</p></div>
          <div><p className="text-sm font-semibold text-warelyn-text">Optional</p><p className="mt-2 text-sm text-warelyn-muted">{optionalColumns.join(', ')}</p></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Upload</h2></CardHeader>
        <CardBody className="space-y-4">
          <CSVImportDropzone file={file} onFileChange={setFile} />
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-warelyn-text">Mode
              <select className="mt-2 block w-full rounded-lg border border-warelyn-border px-3 py-2.5 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="create_only">Create only</option>
                <option value="update_existing">Update existing</option>
                <option value="upsert">Upsert</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm font-medium text-warelyn-text">
              <input checked={createMissing} type="checkbox" onChange={(event) => setCreateMissing(event.target.checked)} />
              Create missing category, brand, vendor
            </label>
            <div className="flex items-end"><Button disabled={isBusy} onClick={upload}>{isBusy ? 'Working...' : 'Upload CSV'}</Button></div>
          </div>
        </CardBody>
      </Card>
      {job ? (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold text-warelyn-text">Import summary</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid gap-3 md:grid-cols-6">
              {['status', 'total_rows', 'valid_rows', 'error_rows', 'created_count', 'updated_count'].map((field) => <div key={field}><p className="text-xs uppercase text-warelyn-muted">{field}</p><p className="font-semibold text-warelyn-text">{job[field]}</p></div>)}
            </div>
            <div className="flex gap-3"><Button disabled={isBusy || job.status === 'COMMITTED'} onClick={validate}>Validate</Button><Button disabled={isBusy || !canCommit} variant="accent" onClick={commit}>Commit valid rows</Button></div>
            {rows.length ? <ImportPreviewTable rows={rows} /> : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
