import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector, useDispatch } from 'react-redux';

function PriceAlerts() {
  const [newAlert, setNewAlert] = useState({
    coinId: '',
    price: '',
    condition: 'above' // 'above' veya 'below'
  });
  const dispatch = useDispatch();
  const alerts = useSelector(state => state.alerts.items);
  const coins = useSelector(state => state.crypto.data);

  const handleAddAlert = () => {
    dispatch({
      type: 'alerts/addAlert',
      payload: newAlert
    });
    setNewAlert({ coinId: '', price: '', condition: 'above' });
  };

  const handleDeleteAlert = (alertId) => {
    dispatch({
      type: 'alerts/removeAlert',
      payload: alertId
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Fiyat Uyarıları
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Select
          value={newAlert.coinId}
          onChange={(e) => setNewAlert({ ...newAlert, coinId: e.target.value })}
          sx={{ minWidth: 200 }}
        >
          {coins.map(coin => (
            <MenuItem key={coin.id} value={coin.id}>
              {coin.name}
            </MenuItem>
          ))}
        </Select>

        <Select
          value={newAlert.condition}
          onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
        >
          <MenuItem value="above">Üstünde</MenuItem>
          <MenuItem value="below">Altında</MenuItem>
        </Select>

        <TextField
          type="number"
          label="Fiyat"
          value={newAlert.price}
          onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
        />

        <Button variant="contained" onClick={handleAddAlert}>
          Uyarı Ekle
        </Button>
      </Box>

      <List>
        {alerts.map((alert, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={`${alert.coinId} ${alert.condition === 'above' ? 'üstünde' : 'altında'} ${alert.price}$`}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleDeleteAlert(alert.id)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default PriceAlerts; 