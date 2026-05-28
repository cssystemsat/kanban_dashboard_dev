import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface Vehicle {
  id: number;
  migrationId: number;
  status: 'enviar' | 'enviado' | 'aguardando' | 'comunicou';
  clientName: string;
  vehicleName: string;
  model?: string;
  vehicleId: string;
  apn?: string;
  apnLogin?: string;
  apnPassword?: string;
  command?: string;
  lineNumber?: string;
  sentAt?: Date;
  communicatedAt?: Date;
  notes?: string;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (vehicles: Omit<Vehicle, 'id' | 'migrationId'>[]) => void;
  migrationId: number;
}

const REQUIRED_COLUMNS = ['Cliente', 'Veículo', 'ID'];
const OPTIONAL_COLUMNS = ['Status', 'Modelo', 'APN', 'Login APN', 'Senha APN', 'Comando', 'Nº Linha'];
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS];

interface ParsedVehicle {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

export default function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  migrationId,
}: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParsedVehicle[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const parseCSV = (text: string): { data: ParsedVehicle[]; errors: ValidationError[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      return {
        data: [],
        errors: [{ row: 0, column: 'arquivo', message: 'CSV vazio ou sem dados' }],
      };
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const validationErrors: ValidationError[] = [];

    // Validar colunas obrigatórias
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      return {
        data: [],
        errors: [
          {
            row: 0,
            column: 'headers',
            message: `Colunas obrigatórias faltando: ${missingColumns.join(', ')}`,
          },
        ],
      };
    }

    const data: ParsedVehicle[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: ParsedVehicle = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validar dados obrigatórios
      if (!row['Cliente']?.trim()) {
        validationErrors.push({
          row: i + 1,
          column: 'Cliente',
          message: 'Cliente é obrigatório',
        });
      }
      if (!row['Veículo']?.trim()) {
        validationErrors.push({
          row: i + 1,
          column: 'Veículo',
          message: 'Veículo é obrigatório',
        });
      }
      if (!row['ID']?.trim()) {
        validationErrors.push({
          row: i + 1,
          column: 'ID',
          message: 'ID do veículo é obrigatório',
        });
      }

      if (row['Cliente'] && row['Veículo'] && row['ID']) {
        data.push(row);
      }
    }

    return { data, errors: validationErrors };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { data, errors } = parseCSV(text);

      if (errors.length > 0) {
        setErrors(errors);
        setParsedData([]);
        setStep('upload');
      } else {
        setParsedData(data);
        setErrors([]);
        setStep('preview');
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      const vehiclesToImport = parsedData.map((row, index) => ({
        id: Math.random(), // Será substituído pelo servidor
        status: (row['Status'] || 'enviar') as Vehicle['status'],
        clientName: row['Cliente'],
        vehicleName: row['Veículo'],
        model: row['Modelo'] || undefined,
        vehicleId: row['ID'],
        apn: row['APN'] || undefined,
        apnLogin: row['Login APN'] || undefined,
        apnPassword: row['Senha APN'] || undefined,
        command: row['Comando'] || undefined,
        lineNumber: row['Nº Linha'] || undefined,
      }));

      onImport(vehiclesToImport);
      setStep('import');

      // Fechar após sucesso
      setTimeout(() => {
        onClose();
        setParsedData([]);
        setErrors([]);
        setStep('upload');
      }, 2000);
    } catch (error) {
      setErrors([{ row: 0, column: 'import', message: 'Erro ao importar dados' }]);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#E0E8F0' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#001F3F' }}>
              Importar Veículos
            </h2>
            <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
              {step === 'upload' && 'Selecione um arquivo CSV para importar'}
              {step === 'preview' && `${parsedData.length} veículo(s) pronto(s) para importar`}
              {step === 'import' && 'Importando dados...'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'upload' && (
            <div className="flex flex-col gap-4">
              {/* Upload Area */}
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:bg-gray-50"
                style={{ borderColor: '#1D4ED8' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: '#1D4ED8' }} />
                <p className="font-semibold mb-1" style={{ color: '#001F3F' }}>
                  Clique ou arraste um arquivo CSV
                </p>
                <p className="text-sm" style={{ color: '#9CA3AF' }}>
                  Suporta até 10.000 linhas
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Template Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold mb-2" style={{ color: '#0C4A6E' }}>
                  Colunas obrigatórias:
                </p>
                <p className="text-sm" style={{ color: '#4A5F7F' }}>
                  Cliente, Veículo, ID
                </p>
                <p className="text-sm font-semibold mt-3 mb-2" style={{ color: '#0C4A6E' }}>
                  Colunas opcionais:
                </p>
                <p className="text-sm" style={{ color: '#4A5F7F' }}>
                  Status, Modelo, APN, Login APN, Senha APN, Comando, Nº Linha
                </p>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" style={{ color: '#DC2626' }} />
                    <p className="font-semibold" style={{ color: '#DC2626' }}>
                      Erros encontrados:
                    </p>
                  </div>
                  <ul className="text-sm space-y-1">
                    {errors.map((error, idx) => (
                      <li key={idx} style={{ color: '#991B1B' }}>
                        {error.row > 0 ? `Linha ${error.row}` : 'Arquivo'}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: '#059669' }} />
                <div>
                  <p className="font-semibold" style={{ color: '#065F46' }}>
                    Arquivo válido!
                  </p>
                  <p className="text-sm" style={{ color: '#047857' }}>
                    {parsedData.length} veículo(s) serão importados
                  </p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F6' }}>
                      <th className="p-2 text-left border" style={{ borderColor: '#E0E8F0' }}>
                        Cliente
                      </th>
                      <th className="p-2 text-left border" style={{ borderColor: '#E0E8F0' }}>
                        Veículo
                      </th>
                      <th className="p-2 text-left border" style={{ borderColor: '#E0E8F0' }}>
                        ID
                      </th>
                      <th className="p-2 text-left border" style={{ borderColor: '#E0E8F0' }}>
                        Modelo
                      </th>
                      <th className="p-2 text-left border" style={{ borderColor: '#E0E8F0' }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#F9FAFB' }}>
                        <td className="p-2 border" style={{ borderColor: '#E0E8F0' }}>
                          {row['Cliente']}
                        </td>
                        <td className="p-2 border" style={{ borderColor: '#E0E8F0' }}>
                          {row['Veículo']}
                        </td>
                        <td className="p-2 border" style={{ borderColor: '#E0E8F0' }}>
                          {row['ID']}
                        </td>
                        <td className="p-2 border" style={{ borderColor: '#E0E8F0' }}>
                          {row['Modelo'] || '-'}
                        </td>
                        <td className="p-2 border" style={{ borderColor: '#E0E8F0' }}>
                          {row['Status'] || 'enviar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.length > 5 && (
                <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
                  ... e mais {parsedData.length - 5} veículo(s)
                </p>
              )}
            </div>
          )}

          {step === 'import' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin">
                <CheckCircle className="w-12 h-12" style={{ color: '#059669' }} />
              </div>
              <p className="font-semibold" style={{ color: '#001F3F' }}>
                Importando {parsedData.length} veículo(s)...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t" style={{ borderColor: '#E0E8F0' }}>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#E0E8F0', color: '#001F3F' }}
          >
            Cancelar
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#059669' }}
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
