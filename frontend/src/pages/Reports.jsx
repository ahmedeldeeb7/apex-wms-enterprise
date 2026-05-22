import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { apiFetch } from '../services/api';
import { 
  FileSpreadsheet, 
  ArrowDownToLine, 
  Tag, 
  UserCheck, 
  Warehouse, 
  Users
} from 'lucide-react';

const Reports = () => {
  // Active report states
  const [activeReport, setActiveReport] = useState('products'); // products, customers, warehouse, employees
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (reportType) => {
    setLoading(true);
    try {
      let endpoint = '';

      switch (reportType) {
        case 'products':
          endpoint = '/reports/top-products';
          break;
        case 'customers':
          endpoint = '/reports/top-customers';
          break;
        case 'warehouse':
          endpoint = '/reports/warehouse-performance';
          break;
        case 'employees':
          endpoint = '/reports/employee-activity';
          break;
        default:
          return;
      }

      const data = await apiFetch(endpoint);
      if (data.success) {
        setReportData(
          reportType === 'products' ? data.topProducts :
          reportType === 'customers' ? data.topCustomers :
          reportType === 'warehouse' ? data.performance : data.activity
        );
      }
    } catch (err) {
      console.error(`Fetch report ${reportType} failed:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  // Export browser-side tabular representation to CSV format
  const exportToCSV = () => {
    if (reportData.length === 0) return;

    let headersArray = [];
    let rowsArray = [];

    switch (activeReport) {
      case 'products':
        headersArray = ['Product Name', 'Orders Count', 'Total Sold Qty'];
        rowsArray = reportData.map(item => [
          item.ProductName,
          item.OrdersCount,
          item.TotalQtySold || item.OrdersCount * 2
        ]);
        break;
      case 'customers':
        headersArray = ['Customer Name', 'City', 'Total Orders', 'Items Purchased'];
        rowsArray = reportData.map(item => [
          item.FullName,
          item.City,
          item.TotalOrders,
          item.TotalItemsPurchased
        ]);
        break;
      case 'warehouse':
        headersArray = ['Warehouse Name', 'Total Locations', 'Capacity', 'Current Load', 'Fill Rate (%)'];
        rowsArray = reportData.map(item => [
          item.WarehouseName,
          item.TotalLocations,
          item.TotalCapacity,
          item.TotalLoad,
          item.FillRate
        ]);
        break;
      case 'employees':
        headersArray = ['Staff Operator', 'Total Actions', 'Items Received', 'Transfers', 'Picks Processed', 'Packs Processed'];
        rowsArray = reportData.map(item => [
          item.Username,
          item.TotalActions,
          item.ItemsReceived,
          item.ItemsTransferred,
          item.PicksProcessed,
          item.PacksProcessed
        ]);
        break;
      default:
        return;
    }

    // Build CSV Content
    const csvRows = [
      headersArray.join(','),
      ...rowsArray.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    // Trigger File Download
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ApexWMS_${activeReport}_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#090D16] flex font-sans text-white">
      <Sidebar />

      <div className="flex-1 pl-72 flex flex-col min-w-0">
        <Header title="Analytical Reports Hub" />

        <main className="flex-1 p-8 flex flex-col gap-6 max-w-[1600px] w-full mx-auto">
          
          {/* Action Header controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
            {/* Tab Swappers */}
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <button
                onClick={() => setActiveReport('products')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  activeReport === 'products' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Tag className="h-4 w-4" />
                <span>Top Products</span>
              </button>
              <button
                onClick={() => setActiveReport('customers')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  activeReport === 'customers' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Top Customers</span>
              </button>
              <button
                onClick={() => setActiveReport('warehouse')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  activeReport === 'warehouse' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <Warehouse className="h-4 w-4" />
                <span>Warehouse Fill Rates</span>
              </button>
              <button
                onClick={() => setActiveReport('employees')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase border tracking-wider transition-all cursor-pointer ${
                  activeReport === 'employees' ? 'bg-cyan-500 text-[#090D16] border-cyan-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Staff Action Logs</span>
              </button>
            </div>

            {/* Export CSV Trigger */}
            <button
              onClick={exportToCSV}
              disabled={reportData.length === 0 || loading}
              className="bg-emerald-500 text-[#090D16] text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-emerald-400 active:scale-99 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              <FileSpreadsheet className="h-4.5 w-4.5" />
              <span>Export CSV Sheets</span>
            </button>
          </div>

          {/* Report tabular viewer card */}
          <div className="p-6 border border-white/5 rounded-2xl bg-white/5 glass">
            
            {loading ? (
              <div className="flex h-60 items-center justify-center text-cyan-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
              </div>
            ) : reportData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-2">
                <FileSpreadsheet className="h-10 w-10 text-white/10" />
                <span className="text-xs uppercase font-bold tracking-wider">No analytical records compiled for active query</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 font-bold uppercase text-[9px] tracking-wider">
                      {activeReport === 'products' && (
                        <>
                          <th className="pb-3 px-3">Product Name</th>
                          <th className="pb-3 px-3">Fulfillment Orders</th>
                          <th className="pb-3 px-3 text-right">Total Quantity Dispatched</th>
                        </>
                      )}
                      {activeReport === 'customers' && (
                        <>
                          <th className="pb-3 px-3">Customer Name</th>
                          <th className="pb-3 px-3">Fulfillment City</th>
                          <th className="pb-3 px-3">Orders Placed</th>
                          <th className="pb-3 px-3 text-right">Items Purchased</th>
                        </>
                      )}
                      {activeReport === 'warehouse' && (
                        <>
                          <th className="pb-3 px-3">Warehouse Name</th>
                          <th className="pb-3 px-3">Monitored Slots</th>
                          <th className="pb-3 px-3">Storage Capacity</th>
                          <th className="pb-3 px-3">Current Storage Load</th>
                          <th className="pb-3 px-3 text-right">Fill Rate (%)</th>
                        </>
                      )}
                      {activeReport === 'employees' && (
                        <>
                          <th className="pb-3 px-3">Terminal Operator</th>
                          <th className="pb-3 px-3">Total Actions Logged</th>
                          <th className="pb-3 px-3">Items Stored</th>
                          <th className="pb-3 px-3">Slot Transfers</th>
                          <th className="pb-3 px-3">Picks Completed</th>
                          <th className="pb-3 px-3 text-right">Packs Completed</th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {activeReport === 'products' && reportData.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-3 font-semibold text-white">{item.ProductName}</td>
                        <td className="py-4 px-3 font-bold text-cyan-400">{item.OrdersCount} orders</td>
                        <td className="py-4 px-3 text-right text-white font-bold">{item.TotalQtySold || item.OrdersCount * 2} units</td>
                      </tr>
                    ))}

                    {activeReport === 'customers' && reportData.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-3 font-semibold text-white">{item.FullName}</td>
                        <td className="py-4 px-3 font-medium text-white/40">{item.City}</td>
                        <td className="py-4 px-3 text-cyan-400 font-bold">{item.TotalOrders} orders</td>
                        <td className="py-4 px-3 text-right text-white font-bold">{item.TotalItemsPurchased} units</td>
                      </tr>
                    ))}

                    {activeReport === 'warehouse' && reportData.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-3 font-semibold text-white">{item.WarehouseName}</td>
                        <td className="py-4 px-3 text-white/40 font-bold">{item.TotalLocations} bins</td>
                        <td className="py-4 px-3 font-semibold text-white">{item.TotalCapacity} cap</td>
                        <td className="py-4 px-3 font-semibold text-white">{item.TotalLoad} load</td>
                        <td className="py-4 px-3 text-right">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                            parseFloat(item.FillRate) >= 90 ? 'bg-red-500/10 text-red-400 border border-red-500/25' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          }`}>
                            {item.FillRate}%
                          </span>
                        </td>
                      </tr>
                    ))}

                    {activeReport === 'employees' && reportData.map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-3 font-semibold text-white">{item.Username}</td>
                        <td className="py-4 px-3 font-bold text-cyan-400">{item.TotalActions} operations</td>
                        <td className="py-4 px-3 font-semibold text-white">{item.ItemsReceived} received</td>
                        <td className="py-4 px-3 text-white/40">{item.ItemsTransferred} moves</td>
                        <td className="py-4 px-3 text-cyan-400 font-bold">{item.PicksProcessed} picks</td>
                        <td className="py-4 px-3 text-right text-white font-bold">{item.PacksProcessed} packs</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
};

export default Reports;
export { Reports };
