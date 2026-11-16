import React, { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Button,
  IconButton,
  Divider,
  Chip,
  TextField,
  Tooltip,
  Collapse,
  Paper,
  Stack,
} from '@mui/material'

import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import CableIcon from '@mui/icons-material/Cable'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import RefreshIcon from '@mui/icons-material/Refresh'
import RouterIcon from '@mui/icons-material/Router'
import SensorsIcon from '@mui/icons-material/Sensors'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorOutlineIcon from '@mui/icons-material/Error'

const COLORS = {
  panel: '#111923',
  card: '#151F2B',
  input: '#202B3A',
  border: '#263342',
  text: '#E2E8F0',
  secondary: '#A3B1C2',
  green: '#10D98B',
  cyan: '#22D3EE',
  red: '#EF4444',
  amber: '#F59E0B',
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 30,
    color: COLORS.text,
    fontSize: 11,
    backgroundColor: COLORS.input,
    borderRadius: '6px',
    '& fieldset': { borderColor: 'transparent' },
    '&:hover fieldset': { borderColor: '#3B5067' },
    '&.Mui-focused fieldset': { borderColor: COLORS.cyan },
  },
  '& .MuiInputBase-input': { px: 1, py: 0.6 },
}

const selectSx = {
  height: 30,
  color: COLORS.text,
  fontSize: 11,
  backgroundColor: COLORS.input,
  borderRadius: '6px',
  '& .MuiSelect-select': { py: '5px', px: 1 },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3B5067' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLORS.cyan },
  '& .MuiSvgIcon-root': { color: '#AAB8C8', fontSize: 17 },
}

const menuProps = {
  PaperProps: {
    sx: {
      bgcolor: '#1B2634',
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      '& .MuiMenuItem-root': {
        minHeight: 30,
        fontSize: 11,
        '&:hover': { bgcolor: '#2A394B' },
        '&.Mui-selected': { bgcolor: '#263B4E' },
      },
    },
  },
}

const makeId = () => `mb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const createConnection = (index = 1) => ({
  id: makeId(),
  name: `Modbus Connection ${String(index).padStart(2, '0')}`,
  mode: 'RTU',
  comPort: 'COM4',
  baudRate: '9600',
  parity: 'None',
  dataBits: '8',
  stopBits: '1',
  slaveIds: [1],
  newSlaveId: '',
  functionCode: '04',
  pollingInterval: '100',
  timeout: '1000',
  status: 'disconnected',
  statusMessage: 'Not connected',
  expanded: true,
  registers: [
    { key: 'voltage', label: 'Voltage', address: '0x0014' },
    { key: 'current', label: 'Current', address: '0x0016' },
    { key: 'powerFactor', label: 'Power Factor', address: '0x0018' },
    { key: 'activeEnergy', label: 'Active Energy', address: '0x0000' },
  ],
})

function Field({ label, children, fullWidth = false }) {
  return (
    <Box sx={{ minWidth: 0, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <Typography sx={{ mb: 0.45, color: COLORS.secondary, fontSize: 10, fontWeight: 600 }}>
        {label}
      </Typography>
      {children}
    </Box>
  )
}

function SelectField({ value, onChange, options, disabled = false }) {
  return (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
        sx={selectSx}
        MenuProps={menuProps}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

function Status({ status, message }) {
  const connected = status === 'connected'
  const testing = status === 'testing'
  const color = connected ? COLORS.green : testing ? COLORS.amber : COLORS.red
  const Icon = connected ? CheckCircleIcon : ErrorOutlineIcon

  return (
    <Stack direction="row" spacing={0.6}  sx={{ minWidth: 0,alignItems:'center' }}>
      <Box sx={{
        width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0,
        boxShadow: `0 0 7px ${color}66`,
      }} />
      <Typography noWrap sx={{ color: connected ? COLORS.green : testing ? COLORS.amber : '#CBD5E1', fontSize: 10, fontWeight: 600 }}>
        {message}
      </Typography>
    </Stack>
  )
}

/**
 * Multi-connection Modbus configuration panel.
 *
 * Optional integration callbacks:
 * onTestConnection(connection)
 * onConnect(connection)
 * onDisconnect(connection)
 * onConnectionsChange(connections)
 *
 * The callbacks should be connected to your Tauri invoke commands.
 */
export default function ModbusConfig({
  availablePorts = ['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6'],
  onTestConnection,
  onConnect,
  onDisconnect,
  onConnectionsChange,
}) {
  const [connections, setConnections] = useState(() => [createConnection(1)])
  const [busyId, setBusyId] = useState(null)

  const connectedCount = useMemo(
    () => connections.filter((item) => item.status === 'connected').length,
    [connections],
  )

  const updateConnection = (id, patch) => {
    setConnections((current) => {
      const next = current.map((item) => item.id === id ? { ...item, ...patch } : item)
      onConnectionsChange?.(next)
      return next
    })
  }

  const updateField = (id, field) => (event) => {
    updateConnection(id, { [field]: event.target.value })
  }

  const addConnection = () => {
    setConnections((current) => {
      const next = [...current, createConnection(current.length + 1)]
      onConnectionsChange?.(next)
      return next
    })
  }

  const removeConnection = (id) => {
    setConnections((current) => {
      const target = current.find((item) => item.id === id)
      if (target?.status === 'connected') return current
      const next = current.filter((item) => item.id !== id)
      onConnectionsChange?.(next)
      return next
    })
  }

  const addSlaveId = (connection) => {
    const value = Number(connection.newSlaveId)
    if (!Number.isInteger(value) || value < 1 || value > 247) return
    if (connection.slaveIds.includes(value)) return
    updateConnection(connection.id, {
      slaveIds: [...connection.slaveIds, value].sort((a, b) => a - b),
      newSlaveId: '',
    })
  }

  const removeSlaveId = (connection, slaveId) => {
    if (connection.slaveIds.length <= 1) return
    updateConnection(connection.id, {
      slaveIds: connection.slaveIds.filter((id) => id !== slaveId),
    })
  }

  const runAction = async (connection, action) => {
    setBusyId(connection.id)
    updateConnection(connection.id, {
      status: action === 'test' ? 'testing' : connection.status,
      statusMessage: action === 'test' ? 'Testing connection…' : 'Connecting…',
    })

    try {
      let result
      if (action === 'test') {
        result = await onTestConnection?.(connection)
        updateConnection(connection.id, {
          status: connection.status,
          statusMessage: result?.message || (onTestConnection ? 'Test successful' : 'Test callback not connected'),
        })
      } else {
        result = await onConnect?.(connection)
        updateConnection(connection.id, {
          status: onConnect ? 'connected' : 'disconnected',
          statusMessage: result?.message || (onConnect ? 'Connected' : 'Connect callback not connected'),
        })
      }
    } catch (error) {
      updateConnection(connection.id, {
        status: 'disconnected',
        statusMessage: error?.message || 'Operation failed',
      })
    } finally {
      setBusyId(null)
    }
  }

  const disconnect = async (connection) => {
    setBusyId(connection.id)
    try {
      await onDisconnect?.(connection)
      updateConnection(connection.id, {
        status: 'disconnected',
        statusMessage: 'Disconnected',
      })
    } catch (error) {
      updateConnection(connection.id, {
        status: 'connected',
        statusMessage: error?.message || 'Disconnect failed',
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Box sx={{
      width: '100%', bgcolor: COLORS.panel, color: COLORS.text,
      border: `1px solid ${COLORS.border}`, borderRadius: '10px',
      overflow: 'scroll', boxSizing: 'border-box',
    }}>
      {/* Panel header */}
      <Box sx={{ px: 1.4, py: 1, display: 'flex', alignItems: 'center', gap: 0.9 }}>
        <SettingsInputAntennaIcon sx={{ color: COLORS.green, fontSize: 19 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ color: '#F1F5F9', fontSize: 12, fontWeight: 700 }}>
            Modbus Configuration
          </Typography>
          <Typography sx={{ color: COLORS.secondary, fontSize: 9.5 }}>
            Manage multiple serial connections and slave devices
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${connectedCount}/${connections.length} connected`}
          sx={{
            height: 21, color: connectedCount ? COLORS.green : COLORS.secondary,
            bgcolor: connectedCount ? '#103629' : '#202B3A',
            fontSize: 9, fontWeight: 700,
          }}
        />
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addConnection}
          sx={{
            height: 27, px: 1, color: COLORS.green, border: '1px solid #167A59',
            borderRadius: '6px', fontSize: 10, fontWeight: 700, textTransform: 'none',
            '&:hover': { bgcolor: '#103629', borderColor: COLORS.green },
          }}
        >
          Add connection
        </Button>
      </Box>
      <Divider sx={{ borderColor: COLORS.border }} />

      <Stack spacing={1} sx={{ p: 1.2 }}>
        {connections.map((connection, index) => {
          const isConnected = connection.status === 'connected'
          const isBusy = busyId === connection.id

          return (
            <Paper
              key={connection.id}
              elevation={0}
              sx={{
                bgcolor: COLORS.card, border: `1px solid ${isConnected ? '#176448' : COLORS.border}`,
                borderRadius: '8px', overflow: 'hidden',
              }}
            >
              {/* Connection card header */}
              <Box sx={{ px: 1.1, py: 0.8, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{
                  width: 27, height: 27, display: 'grid', placeItems: 'center',
                  borderRadius: '6px', bgcolor: '#202F3D', color: COLORS.cyan,
                }}>
                  <CableIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 10.8, fontWeight: 700, color: COLORS.text }}>
                    {connection.name || `Modbus Connection ${index + 1}`}
                  </Typography>
                  <Typography sx={{ fontSize: 9, color: COLORS.secondary }}>
                    {connection.mode === 'RTU' ? `${connection.comPort} · ${connection.slaveIds.length} slave device(s)` : `TCP · ${connection.slaveIds.length} slave device(s)`}
                  </Typography>
                </Box>
                <Status status={connection.status} message={connection.statusMessage} />
                <Tooltip title={connection.expanded ? 'Collapse settings' : 'Expand settings'}>
                  <IconButton
                    size="small"
                    onClick={() => updateConnection(connection.id, { expanded: !connection.expanded })}
                    sx={{ color: COLORS.secondary, p: 0.35 }}
                  >
                    {connection.expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title={isConnected ? 'Disconnect before removing' : 'Remove connection'}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={isConnected || connections.length === 1}
                      onClick={() => removeConnection(connection.id)}
                      sx={{ color: COLORS.red, p: 0.35 }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              <Collapse in={connection.expanded} unmountOnExit>
                <Divider sx={{ borderColor: COLORS.border }} />
                <Box sx={{ p: 1.1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1, mb: 1 }}>
                    <Field label="Connection name">
                      <TextField
                        fullWidth size="small" value={connection.name}
                        onChange={(e) => updateConnection(connection.id, { name: e.target.value })}
                        sx={fieldSx}
                      />
                    </Field>
                    <Field label="Protocol">
                      <SelectField value={connection.mode} onChange={updateField(connection.id, 'mode')} options={[
                        { value: 'RTU', label: 'Modbus RTU' },
                        { value: 'TCP', label: 'Modbus TCP' },
                      ]} />
                    </Field>

                    {connection.mode === 'RTU' ? (
                      <Field label="COM Port">
                        <SelectField value={connection.comPort} onChange={updateField(connection.id, 'comPort')}
                          options={availablePorts.map((port) => ({ value: port, label: port }))} />
                      </Field>
                    ) : (
                      <Field label="Host / IP">
                        <TextField fullWidth size="small" value={connection.host || '192.168.1.100'}
                          onChange={(e) => updateConnection(connection.id, { host: e.target.value })} sx={fieldSx} />
                      </Field>
                    )}

                    {connection.mode === 'TCP' ? (
                      <Field label="TCP Port">
                        <TextField fullWidth size="small" type="number" value={connection.tcpPort || 502}
                          onChange={(e) => updateConnection(connection.id, { tcpPort: e.target.value })} sx={fieldSx} />
                      </Field>
                    ) : (
                      <Field label="Baud Rate">
                        <SelectField value={connection.baudRate} onChange={updateField(connection.id, 'baudRate')} options={[
                          '4800', '9600', '19200', '38400', '57600', '115200',
                        ].map((value) => ({ value, label: value }))} />
                      </Field>
                    )}

                    {connection.mode === 'RTU' && <>
                      <Field label="Parity">
                        <SelectField value={connection.parity} onChange={updateField(connection.id, 'parity')} options={[
                          'None', 'Even', 'Odd',
                        ].map((value) => ({ value, label: value }))} />
                      </Field>
                      <Field label="Data Bits">
                        <SelectField value={connection.dataBits} onChange={updateField(connection.id, 'dataBits')} options={[
                          { value: '7', label: '7' }, { value: '8', label: '8' },
                        ]} />
                      </Field>
                      <Field label="Stop Bits">
                        <SelectField value={connection.stopBits} onChange={updateField(connection.id, 'stopBits')} options={[
                          { value: '1', label: '1' }, { value: '2', label: '2' },
                        ]} />
                      </Field>
                    </>}
                  </Box>

                  {/* Multiple slave IDs */}
                  <Box sx={{
                    p: 1, mb: 1, borderRadius: '7px', bgcolor: '#111B26',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <Stack direction="row" spacing={0.7} sx={{ mb: 0.7, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        <SensorsIcon sx={{ color: COLORS.cyan, fontSize: 15 }} />
                      <Typography sx={{ color: COLORS.text, fontSize: 10.5, fontWeight: 700 }}>
                        Slave devices on this connection
                      </Typography>
                      <Chip size="small" label={`${connection.slaveIds.length} added`}
                        sx={{ height: 18, color: COLORS.cyan, bgcolor: '#153342', fontSize: 9 }} />
                      </Box>
                       <Box>
                          <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addSlaveId(connection)}
                        sx={{ height: 28, color: COLORS.cyan, fontSize: 9.5, textTransform: 'none' }}
                      >
                        Add slave
                      </Button>
                       </Box>

                    </Stack>
                    

                        <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 0.7,
                            width: '100%',
                            minWidth: 0,
                        }}
                        >
                        {connection.slaveIds.map((slaveId) => (
                            <Chip
                            key={slaveId}
                            label={`Slave ${slaveId}`}
                            onDelete={
                                connection.slaveIds.length > 1
                                ? () => removeSlaveId(connection, slaveId)
                                : undefined
                            }
                            size="small"
                            sx={{
                                height: 25,
                                flexShrink: 0,
                                bgcolor: '#203344',
                                color: '#D9EAF5',
                                border: '1px solid #34536B',
                                fontSize: 10,
                                fontWeight: 600,
                                '& .MuiChip-deleteIcon': {
                                color: '#9FB4C7',
                                fontSize: 14,
                                '&:hover': {
                                    color: COLORS.red,
                                },
                                },
                            }}
                            />
                        ))}

                        <Box
                            sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.6,
                            flexShrink: 0,
                            }}
                        >
                            <TextField
                            size="small"
                            type="number"
                            placeholder="ID 1–247"
                            value={connection.newSlaveId}
                            onChange={(e) =>
                                updateConnection(connection.id, {
                                newSlaveId: e.target.value,
                                })
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addSlaveId(connection)
                            }}
                            inputProps={{ min: 1, max: 247 }}
                            sx={{
                                ...fieldSx,
                                width: 95,
                            }}
                            />

                            <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => addSlaveId(connection)}
                            sx={{
                                height: 29,
                                minWidth: 'auto',
                                px: 1,
                                color: COLORS.cyan,
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                            }}
                            >
                            Add
                            </Button>
                        </Box>
                        </Box>


                    <Typography sx={{ mt: 0.65, color: '#8294A8', fontSize: 9 }}>
                      Each slave ID must be unique on this physical bus (1–247). A slave can only be assigned once per connection.
                    </Typography>
                  </Box>

                  {/* Read settings */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                   
                    <Field label="Polling Interval">
                      <SelectField value={connection.pollingInterval} onChange={updateField(connection.id, 'pollingInterval')} options={[
                        { value: '100', label: '100 ms' },
                        { value: '250', label: '250 ms' },
                        { value: '500', label: '500 ms' },
                        { value: '1000', label: '1 sec' },
                        { value: '2000', label: '2 sec' },
                      ]} />
                    </Field>
                    <Field label="Response Timeout">
                      <SelectField value={connection.timeout} onChange={updateField(connection.id, 'timeout')} options={[
                        { value: '500', label: '500 ms' },
                        { value: '1000', label: '1 sec' },
                        { value: '2000', label: '2 sec' },
                        { value: '5000', label: '5 sec' },
                      ]} />
                    </Field>
                  </Box>


                  {/* Actions */}
                  <Divider sx={{ my: 1, borderColor: COLORS.border }} />
                  <Stack direction="row" spacing={0.8} sx={{alignItems:'center'}} flexWrap="wrap" useFlexGap>
                    <Button
                      size="small" variant="outlined" disabled={isBusy}
                      startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                      onClick={() => runAction(connection, 'test')}
                      sx={{
                        height: 27, px: 1, borderColor: '#087F9B', color: COLORS.cyan,
                        fontSize: 9.5, fontWeight: 700, textTransform: 'none',
                        '&:hover': { borderColor: COLORS.cyan, bgcolor: '#102C38' },
                      }}
                    >
                      {connection.status === 'testing' ? 'Testing…' : 'Test all slaves'}
                    </Button>

                    {isConnected ? (
                      <Button
                        size="small" variant="contained" disabled={isBusy}
                        startIcon={<LinkOffIcon sx={{ fontSize: 14 }} />}
                        onClick={() => disconnect(connection)}
                        sx={{
                          height: 27, px: 1.2, bgcolor: '#9A4A20', fontSize: 9.5,
                          fontWeight: 700, textTransform: 'none',
                          '&:hover': { bgcolor: '#7C391B' },
                        }}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="small" variant="contained" disabled={isBusy}
                        startIcon={<LinkIcon sx={{ fontSize: 14 }} />}
                        onClick={() => runAction(connection, 'connect')}
                        sx={{
                          height: 27, px: 1.2, bgcolor: '#079B65', fontSize: 9.5,
                          fontWeight: 700, textTransform: 'none', boxShadow: 'none',
                          '&:hover': { bgcolor: '#078052', boxShadow: 'none' },
                        }}
                      >
                        Connect connection
                      </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Typography sx={{ color: COLORS.secondary, fontSize: 9 }}>
                      {connection.slaveIds.length} slave(s) · {connection.pollingInterval} ms interval
                    </Typography>
                  </Stack>
                </Box>
              </Collapse>
            </Paper>
          )
        })}
      </Stack>

      <Divider sx={{ borderColor: COLORS.border }} />
      <Box sx={{ px: 1.4, py: 0.8, display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <RouterIcon sx={{ color: COLORS.secondary, fontSize: 14 }} />
        <Typography sx={{ color: COLORS.secondary, fontSize: 9 }}>
          Separate physical ports require separate connections. Multiple slave IDs can share one RS-485 bus.
        </Typography>
      </Box>
    </Box>
  )
}
