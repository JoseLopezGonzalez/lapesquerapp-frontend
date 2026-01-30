'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Upload, Download, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { createBulkPunches, validateBulkPunches } from '@/services/punchService';
import { employeeService } from '@/services/domain/employees/employeeService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function BulkPunchExcelUpload() {
  const { data: session } = useSession();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [submitResults, setSubmitResults] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  // Cargar opciones de empleados
  useEffect(() => {
    const loadEmployees = async () => {
      if (!session?.user?.accessToken) return;

      try {
        setLoadingEmployees(true);
        const options = await employeeService.getOptions();
        setEmployeeOptions(options || []);
      } catch (error) {
        console.error('Error al cargar empleados:', error);
        toast.error('Error al cargar la lista de empleados', getToastTheme());
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [session]);

  // Función para buscar empleado por nombre
  const findEmployeeByName = (name) => {
    if (!name || employeeOptions.length === 0) return null;
    const nameLower = String(name).trim().toLowerCase();
    // Buscar coincidencia exacta primero
    let employee = employeeOptions.find(emp => 
      String(emp.label).toLowerCase() === nameLower
    );
    // Si no hay coincidencia exacta, buscar parcial
    if (!employee) {
      employee = employeeOptions.find(emp => 
        String(emp.label).toLowerCase().includes(nameLower) ||
        nameLower.includes(String(emp.label).toLowerCase())
      );
    }
    return employee || null;
  };

  // Función para convertir tipo de evento
  const convertEventType = (eventType) => {
    const typeLower = String(eventType).trim().toLowerCase();
    if (typeLower === 'entrada' || typeLower === 'in') return 'IN';
    if (typeLower === 'salida' || typeLower === 'out') return 'OUT';
    return null;
  };

  // Parsear Excel
  const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const fileData = new Uint8Array(e.target.result);
          const workbook = XLSX.read(fileData, { type: 'array' });
          
          // Obtener la primera hoja
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            throw new Error('El archivo Excel no tiene hojas');
          }
          
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData.length === 0) {
            throw new Error('El archivo Excel está vacío');
          }

          // Detectar si hay encabezados (primera fila) - soportar español e inglés
          const firstRow = jsonData[0] || [];
          const hasHeaders = firstRow.some(cell => {
            const cellLower = String(cell).toLowerCase();
            return cellLower.includes('empleado') || cellLower.includes('employee') ||
                   cellLower.includes('tipo') || cellLower.includes('event') ||
                   cellLower.includes('fecha') || cellLower.includes('timestamp');
          });

          const startIndex = hasHeaders ? 1 : 0;
          const headers = hasHeaders ? firstRow.map(h => String(h).trim().toLowerCase()) : null;
          // Soporta tanto español como inglés
          const expectedHeaders = headers || ['empleado', 'tipo', 'fecha y hora'];

          const parsedRows = [];
          const errors = [];

          for (let i = startIndex; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0 || row.every(cell => !cell)) continue;

            if (row.length < 3) {
              errors.push({
                row: i + 1,
                message: `Fila ${i + 1}: No tiene suficientes columnas (esperadas: 3, encontradas: ${row.length})`,
              });
              continue;
            }

            // Mapear valores según headers o posición
            let employeeName, eventType, timestamp;

            if (headers) {
              // Buscar índices - soportar español e inglés
              const employeeIdx = expectedHeaders.findIndex(h => 
                h.includes('empleado') || h.includes('employee')
              );
              const eventTypeIdx = expectedHeaders.findIndex(h => 
                h.includes('tipo') || h.includes('event')
              );
              const timestampIdx = expectedHeaders.findIndex(h => 
                h.includes('fecha') || h.includes('timestamp') || h.includes('hora')
              );

              employeeName = row[employeeIdx >= 0 ? employeeIdx : 0];
              eventType = row[eventTypeIdx >= 0 ? eventTypeIdx : 1];
              timestamp = row[timestampIdx >= 0 ? timestampIdx : 2];
            } else {
              employeeName = row[0];
              eventType = row[1];
              timestamp = row[2];
            }

            // Convertir a string y limpiar
            employeeName = String(employeeName || '').trim();
            eventType = String(eventType || '').trim();
            timestamp = String(timestamp || '').trim();

            if (!employeeName || !eventType || !timestamp) {
              errors.push({
                row: i + 1,
                message: `Fila ${i + 1}: Faltan datos obligatorios`,
              });
              continue;
            }

            // Buscar empleado por nombre
            const employee = findEmployeeByName(employeeName);
            if (!employee) {
              errors.push({
                row: i + 1,
                message: `Fila ${i + 1}: No se encontró el empleado "${employeeName}"`,
              });
              continue;
            }

            // Convertir tipo de evento
            const eventTypeConverted = convertEventType(eventType);
            if (!eventTypeConverted) {
              errors.push({
                row: i + 1,
                message: `Fila ${i + 1}: Tipo de evento inválido. Debe ser "Entrada" o "Salida"`,
              });
              continue;
            }

            // Validar y convertir timestamp
            let timestampISO;
            try {
              // Intentar parsear diferentes formatos
              let date;
              
              // Si es un número de Excel (días desde 1900-01-01)
              if (typeof timestamp === 'number') {
                // Convertir número de Excel a fecha
                const excelEpoch = new Date(1899, 11, 30);
                date = new Date(excelEpoch.getTime() + timestamp * 86400000);
              } else if (timestamp.includes('T')) {
                // ISO format
                date = new Date(timestamp);
              } else {
                // Formato YYYY-MM-DD HH:mm:ss o YYYY-MM-DD
                const [datePart, timePart] = timestamp.split(' ');
                if (datePart && timePart) {
                  date = new Date(`${datePart}T${timePart}`);
                } else {
                  date = new Date(timestamp);
                }
              }

              if (isNaN(date.getTime())) {
                throw new Error('Fecha inválida');
              }

              timestampISO = date.toISOString();
            } catch (error) {
              errors.push({
                row: i + 1,
                message: `Fila ${i + 1}: Formato de fecha inválido: "${timestamp}"`,
              });
              continue;
            }

            parsedRows.push({
              id: i,
              employee_id: employee.value,
              employee_name: employee.label,
              event_type: eventTypeConverted,
              event_type_display: eventType,
              timestamp: timestampISO,
              timestampDisplay: timestamp,
            });
          }

          resolve({ data: parsedRows, errors });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Manejar selección de archivo
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Por favor, selecciona un archivo Excel (.xlsx o .xls)', getToastTheme());
      return;
    }

    // Verificar que los empleados estén cargados
    if (employeeOptions.length === 0 && !loadingEmployees) {
      toast.error('Por favor, espera a que se carguen los empleados', getToastTheme());
      return;
    }

    if (loadingEmployees) {
      toast.error('Por favor, espera a que se carguen los empleados antes de importar', getToastTheme());
      return;
    }

    setFileName(file.name);
    setParsedData([]);
    setValidationResults(null);
    setSubmitResults(null);
    setIsValidated(false);

    try {
      const { data, errors } = await parseExcel(file);

      if (errors.length > 0) {
        toast.error(
          `Se encontraron ${errors.length} error(es) al parsear el Excel`,
          getToastTheme()
        );
        console.warn('Errores de parsing:', errors);
      }

      if (data.length === 0) {
        toast.error('No se encontraron datos válidos en el Excel', getToastTheme());
        return;
      }

      setParsedData(data);
      toast.success(`Se parsearon ${data.length} fichaje(s) correctamente`, getToastTheme());
    } catch (error) {
      console.error('Error al parsear Excel:', error);
      toast.error(`Error al parsear el Excel: ${error.message}`, getToastTheme());
    }
  };

  // Descargar plantilla
  const handleDownloadTemplate = () => {
    try {
      setLoadingTemplate(true);

      // Crear datos para Excel en español
      const headers = ['Empleado', 'Tipo', 'Fecha y Hora'];
      // Usar nombres de ejemplo o los primeros empleados disponibles
      const exampleNames = employeeOptions.length > 0 
        ? [
            employeeOptions[0]?.label || 'Ejemplo Empleado 1',
            employeeOptions[0]?.label || 'Ejemplo Empleado 1',
            employeeOptions.length > 1 ? employeeOptions[1]?.label : employeeOptions[0]?.label || 'Ejemplo Empleado 2',
            employeeOptions.length > 1 ? employeeOptions[1]?.label : employeeOptions[0]?.label || 'Ejemplo Empleado 2',
          ]
        : ['Ejemplo Empleado 1', 'Ejemplo Empleado 1', 'Ejemplo Empleado 2', 'Ejemplo Empleado 2'];
      
      const rows = [
        [exampleNames[0], 'Entrada', '2024-01-15 08:30:00'],
        [exampleNames[1], 'Salida', '2024-01-15 17:00:00'],
        [exampleNames[2], 'Entrada', '2024-01-15 09:00:00'],
        [exampleNames[3], 'Salida', '2024-01-15 18:00:00'],
      ];

      // Crear worksheet
      const worksheetData = [headers, ...rows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Crear workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Fichajes');

      // Generar archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Descargar
      saveAs(blob, 'plantilla-fichajes.xlsx');
      toast.success('Plantilla descargada correctamente', getToastTheme());
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar la plantilla', getToastTheme());
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Validar fichajes
  const handleValidate = async () => {
    if (parsedData.length === 0) {
      toast.error('No hay datos para validar. Por favor, carga un archivo Excel primero', getToastTheme());
      return;
    }

    if (!session?.user?.accessToken) {
      toast.error('No hay sesión activa', getToastTheme());
      return;
    }

    try {
      setValidating(true);
      const token = session.user.accessToken;

      const punches = parsedData.map(row => ({
        employee_id: parseInt(row.employee_id),
        event_type: row.event_type,
        timestamp: row.timestamp,
        device_id: 'manual-admin',
      }));

      const result = await validateBulkPunches(punches, token);
      setValidationResults(result);

      if (result.invalid === 0) {
        setIsValidated(true);
        toast.success('Todos los fichajes son válidos. Ya puedes registrar', getToastTheme());
      } else {
        setIsValidated(false);
        toast.error(`${result.invalid} fichaje(s) con errores. Corrige los errores antes de registrar`, getToastTheme());
      }
    } catch (error) {
      console.error('Error al validar:', error);
      toast.error('Error al validar los fichajes', getToastTheme());
    } finally {
      setValidating(false);
    }
  };

  // Enviar fichajes
  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      toast.error('No hay datos para registrar. Por favor, carga un archivo Excel primero', getToastTheme());
      return;
    }

    if (!isValidated) {
      toast.error('Debes validar los fichajes antes de registrar. Haz clic en "Validar" primero', getToastTheme());
      return;
    }

    if (!session?.user?.accessToken) {
      toast.error('No hay sesión activa', getToastTheme());
      return;
    }

    try {
      setLoading(true);
      const token = session.user.accessToken;

      const punches = parsedData.map(row => ({
        employee_id: parseInt(row.employee_id),
        event_type: row.event_type,
        timestamp: row.timestamp,
        device_id: 'manual-admin',
      }));

      const result = await createBulkPunches(punches, token);
      setSubmitResults(result);

      if (result.failed === 0) {
        toast.success(`Se registraron ${result.created} fichaje(s) correctamente`, getToastTheme());
        // Limpiar después de éxito
        setTimeout(() => {
          setParsedData([]);
          setFileName('');
          setValidationResults(null);
          setSubmitResults(null);
          setIsValidated(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        toast.error(
          `Se registraron ${result.created} fichaje(s), ${result.failed} fallaron`,
          getToastTheme()
        );
      }
    } catch (error) {
      console.error('Error al registrar fichajes:', error);
      const errorMessage = error.userMessage || error.message || 'Error al registrar los fichajes';
      toast.error(errorMessage, getToastTheme());
    } finally {
      setLoading(false);
    }
  };

  // Limpiar datos
  const handleClear = () => {
    setParsedData([]);
    setFileName('');
    setValidationResults(null);
    setSubmitResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getRowValidation = (index) => {
    if (!validationResults) return null;
    return validationResults.validation_results?.[index] || null;
  };

  const getRowSubmitResult = (index) => {
    if (!submitResults) return null;
    return submitResults.results?.[index] || null;
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Registro Masivo desde Excel</CardTitle>
        <CardDescription>
          Importa múltiples fichajes desde un archivo Excel (.xlsx)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 min-h-0 overflow-y-auto">
        {/* Indicador de carga de empleados */}
        {loadingEmployees && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Cargando lista de empleados...
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleDownloadTemplate}
            variant="outline"
            disabled={loadingTemplate || loadingEmployees}
          >
            {loadingTemplate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={loadingEmployees}
          >
            <Upload className="mr-2 h-4 w-4" />
            Seleccionar Archivo Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          {parsedData.length > 0 && (
            <>
              <Button
                type="button"
                onClick={handleValidate}
                variant="outline"
                disabled={validating}
              >
                {validating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Validar'
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isValidated}
                className="ml-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  'Importar Fichajes'
                )}
              </Button>
              <Button
                type="button"
                onClick={handleClear}
                variant="ghost"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </>
          )}
        </div>

        {/* Archivo seleccionado */}
        {fileName && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Archivo: {fileName}</span>
            <span className="text-xs text-muted-foreground">
              ({parsedData.length} fichaje(s) parseado(s))
            </span>
          </div>
        )}

        {/* Mensaje de validación requerida */}
        {parsedData.length > 0 && !isValidated && !validating && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Debes validar los fichajes antes de registrar
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Haz clic en "Validar" para verificar la integridad de los datos con los registros existentes
              </p>
            </div>
          </div>
        )}

        {/* Resumen de validación */}
        {validationResults && (
          <div
            className={`p-4 rounded-md border ${
              validationResults.invalid === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {validationResults.invalid === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <p
                className={`text-sm font-medium ${
                  validationResults.invalid === 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {validationResults.valid} válido(s), {validationResults.invalid} con error(es)
              </p>
            </div>
          </div>
        )}

        {/* Resumen de envío */}
        {submitResults && (
          <div
            className={`p-4 rounded-md border ${
              submitResults.failed === 0
                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {submitResults.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <p
                className={`text-sm font-medium ${
                  submitResults.failed === 0
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {submitResults.created} registrado(s), {submitResults.failed} fallido(s)
              </p>
            </div>
            {submitResults.errors && submitResults.errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {submitResults.errors.map((error, idx) => (
                  <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                    Fila {error.index + 1}: {error.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista previa de datos */}
        {parsedData.length > 0 ? (
          <div className="border rounded-md overflow-x-auto max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.map((row, index) => {
                  const validation = getRowValidation(index);
                  const submitResult = getRowSubmitResult(index);
                  const hasError = validation && !validation.valid;
                  const hasSubmitError = submitResult && !submitResult.success;

                  return (
                    <TableRow
                      key={row.id}
                      className={hasError || hasSubmitError ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{row.employee_name || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.event_type === 'IN'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}
                        >
                          {row.event_type_display || (row.event_type === 'IN' ? 'Entrada' : 'Salida')}
                        </span>
                      </TableCell>
                      <TableCell>{row.timestampDisplay || new Date(row.timestamp).toLocaleString('es-ES')}</TableCell>
                      <TableCell>
                        {hasError && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {validation.errors.join(', ')}
                          </div>
                        )}
                        {hasSubmitError && (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" />
                            {submitResult.error}
                          </div>
                        )}
                        {!hasError && !hasSubmitError && submitResult?.success && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Registrado
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed rounded-md">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              No hay archivo cargado
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Selecciona un archivo Excel (.xlsx) o descarga la plantilla para ver el formato esperado
            </p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Archivo
            </Button>
          </div>
        )}

        {/* Información adicional */}
        <div className="text-xs text-muted-foreground space-y-1 p-4 bg-muted rounded-md">
          <p className="font-medium mb-2">Formato del Excel:</p>
          <p>• Encabezados: Empleado, Tipo, Fecha y Hora</p>
          <p>• Empleado: Nombre completo del trabajador (debe coincidir exactamente con el nombre registrado)</p>
          <p>• Tipo: "Entrada" o "Salida"</p>
          <p>• Formato de fecha: YYYY-MM-DD HH:mm:ss, YYYY-MM-DDTHH:mm:ss o formato de fecha de Excel</p>
          <p>• Para crear una sesión completa, añade dos filas consecutivas con el mismo empleado: una con "Entrada" y otra con "Salida"</p>
          <p>• <strong>Es obligatorio validar</strong> los fichajes antes de registrar para verificar la integridad con los datos existentes</p>
          <p>• La validación comprueba que no haya conflictos con fichajes ya registrados en la base de datos</p>
        </div>
      </CardContent>
    </Card>
  );
}

