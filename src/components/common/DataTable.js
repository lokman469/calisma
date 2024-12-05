import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

// Sıralama fonksiyonu
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const DataTable = ({
  columns,
  rows,
  onRowClick,
  onEdit,
  onDelete,
  selectable = false,
  sortable = false,
  pagination = true,
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  sx = {}
}) => {
  const theme = useTheme();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState(columns[0]?.id || '');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultRowsPerPage);

  // Sıralama işleyicisi
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Seçim işleyicisi
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  // Sayfa değişim işleyicisi
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Sayfa başına satır sayısı değişim işleyicisi
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Seçili mi kontrolü
  const isSelected = (id) => selected.indexOf(id) !== -1;

  return (
    <Paper sx={{ width: '100%', mb: 2, ...sx }}>
      <TableContainer>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < rows.length}
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                    inputProps={{
                      'aria-label': 'select all desserts',
                    }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  padding={column.disablePadding ? 'none' : 'normal'}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  {sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={(event) => handleRequestSort(event, column.id)}
                    >
                      {column.label}
                      {orderBy === column.id ? (
                        <Box component="span" sx={theme.visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell align="right">Aksiyonlar</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {stableSort(rows, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                const isItemSelected = isSelected(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => onRowClick && onRowClick(event, row)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onClick={(event) => handleClick(event, row.id)}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align || 'left'}>
                          {column.format && typeof value === 'number' ? column.format(value) : value}
                        </TableCell>
                      );
                    })}
                    {(onEdit || onDelete) && (
                      <TableCell align="right">
                        {onEdit && (
                          <Tooltip title="Düzenle">
                            <IconButton onClick={() => onEdit(row)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Sil">
                            <IconButton onClick={() => onDelete(row)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Paper>
  );
};

// Kullanım örnekleri:
/*
// Basit kullanım
<DataTable
  columns={[
    { id: 'name', label: 'Ad' },
    { id: 'calories', label: 'Kalori', align: 'right' },
    { id: 'fat', label: 'Yağ (g)', align: 'right' }
  ]}
  rows={[
    { id: 1, name: 'Cupcake', calories: 305, fat: 3.7 },
    { id: 2, name: 'Donut', calories: 452, fat: 25.0 }
  ]}
/>

// Seçilebilir ve sıralanabilir
<DataTable
  selectable
  sortable
  columns={[
    { id: 'name', label: 'Ad' },
    { id: 'calories', label: 'Kalori', align: 'right' },
    { id: 'fat', label: 'Yağ (g)', align: 'right' }
  ]}
  rows={[
    { id: 1, name: 'Cupcake', calories: 305, fat: 3.7 },
    { id: 2, name: 'Donut', calories: 452, fat: 25.0 }
  ]}
/>

// Aksiyonlar ile
<DataTable
  columns={[
    { id: 'name', label: 'Ad' },
    { id: 'calories', label: 'Kalori', align: 'right' },
    { id: 'fat', label: 'Yağ (g)', align: 'right' }
  ]}
  rows={[
    { id: 1, name: 'Cupcake', calories: 305, fat: 3.7 },
    { id: 2, name: 'Donut', calories: 452, fat: 25.0 }
  ]}
  onEdit={(row) => console.log('Düzenle:', row)}
  onDelete={(row) => console.log('Sil:', row)}
/>
*/

export default DataTable; 