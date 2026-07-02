import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers } from '../../api/admin.api';
import { previewCharge, createOrder } from '../../api/order.api';
import ChargePreview from '../../components/ChargePreview';
import { toast } from 'react-toastify';
import { Package, Calculator, ClipboardCheck, ArrowRight, Info, MapPin, Scale, User, RefreshCw } from 'lucide-react';

const CreateOrderBehalf = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  
  const [formData, setFormData] = useState({
    customerId: '',
    pickupAddress: '',
    pickupPincode: '',
    dropAddress: '',
    dropPincode: '',
    length: '',
    breadth: '',
    height: '',
    actualWeight: '',
    orderType: 'B2C',
    paymentType: 'PREPAID'
  });

  const [errors, setErrors] = useState({});
  const [chargeData, setChargeData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomersList = async () => {
    setFetchingCustomers(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      if (data.length > 0) {
        setFormData(p => ({ ...p, customerId: data[0].id }));
      }
    } catch {
      toast.error('Failed to load registered customers list.');
    } finally {
      setFetchingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, []);

  const validate = () => {
    const err = {};
    if (!formData.customerId) err.customerId = 'Customer selection is required';
    if (formData.pickupAddress.length < 10) err.pickupAddress = 'Min 10 characters';
    if (!/^\d{6}$/.test(formData.pickupPincode)) err.pickupPincode = 'Must be 6 digits';
    if (formData.dropAddress.length < 10) err.dropAddress = 'Min 10 characters';
    if (!/^\d{6}$/.test(formData.dropPincode)) err.dropPincode = 'Must be 6 digits';
    if (isNaN(parseFloat(formData.length)) || parseFloat(formData.length) <= 0) err.length = 'Required';
    if (isNaN(parseFloat(formData.breadth)) || parseFloat(formData.breadth) <= 0) err.breadth = 'Required';
    if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) err.height = 'Required';
    if (isNaN(parseFloat(formData.actualWeight)) || parseFloat(formData.actualWeight) <= 0) err.actualWeight = 'Required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setChargeData(null);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the validation errors');
      return;
    }
    setCalculating(true);
    try {
      const data = await previewCharge({
        ...formData,
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        height: parseFloat(formData.height),
        actualWeight: parseFloat(formData.actualWeight)
      });
      setChargeData(data);
      toast.success('Charges calculated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate. Check if pincodes are in zones.');
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!chargeData) return;
    setSubmitting(true);
    try {
      await createOrder({
        ...formData,
        length: parseFloat(formData.length),
        breadth: parseFloat(formData.breadth),
        height: parseFloat(formData.height),
        actualWeight: parseFloat(formData.actualWeight)
      });
      toast.success('Order created on behalf of customer successfully!');
      navigate('/admin/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  const textareaClass = (key) => `w-full px-4 py-2.5 rounded-xl border ${errors[key] ? 'border-red-400 dark:border-red-500/50' : 'border-slate-200 dark:border-indigo-500/20'} bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-400 dark:placeholder-slate-600`;
  const dimInput = (key) => `w-full px-3 py-2.5 rounded-xl border ${errors[key] ? 'border-red-400' : 'border-slate-200 dark:border-indigo-500/20'} bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center`;

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="section-title">Book Shipment on Behalf</h1>
            <p className="section-subtitle">Create orders on behalf of any registered customer account</p>
          </div>
        </div>
        
        <button onClick={fetchCustomersList} disabled={fetchingCustomers} className="btn-secondary py-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${fetchingCustomers ? 'animate-spin360' : ''}`} />
          Reload customers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 animate-slide-up">
          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* Customer Dropdown selector */}
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-500" /> Target Customer Account
              </h3>
              <div className="relative">
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {fetchingCustomers ? (
                    <option disabled>Loading registered users...</option>
                  ) : customers.length === 0 ? (
                    <option disabled>No customers registered in database</option>
                  ) : (
                    customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
              {errors.customerId && <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.customerId}</span>}
            </div>

            {/* Addresses */}
            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-500" /> Addresses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pickup Address</label>
                  <textarea name="pickupAddress" rows="3" value={formData.pickupAddress} onChange={handleInputChange} placeholder="Street, building, locality..." className={textareaClass('pickupAddress')} />
                  {errors.pickupAddress && <span className="text-[10px] text-red-500 font-semibold">{errors.pickupAddress}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Drop Address</label>
                  <textarea name="dropAddress" rows="3" value={formData.dropAddress} onChange={handleInputChange} placeholder="Recipient street, building..." className={textareaClass('dropAddress')} />
                  {errors.dropAddress && <span className="text-[10px] text-red-500 font-semibold">{errors.dropAddress}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pickup Pincode</label>
                  <input type="text" name="pickupPincode" maxLength="6" value={formData.pickupPincode} onChange={handleInputChange} placeholder="e.g. 110001" className={dimInput('pickupPincode')} />
                  {errors.pickupPincode && <span className="text-[10px] text-red-500 font-semibold">{errors.pickupPincode}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Drop Pincode</label>
                  <input type="text" name="dropPincode" maxLength="6" value={formData.dropPincode} onChange={handleInputChange} placeholder="e.g. 110004" className={dimInput('dropPincode')} />
                  {errors.dropPincode && <span className="text-[10px] text-red-500 font-semibold">{errors.dropPincode}</span>}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-indigo-500" /> Package Dimensions & Weight
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[{ name: 'length', label: 'L (cm)' }, { name: 'breadth', label: 'B (cm)' }, { name: 'height', label: 'H (cm)' }, { name: 'actualWeight', label: 'Weight (kg)' }].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                    <input type="number" name={name} step="0.1" value={formData[name]} onChange={handleInputChange} placeholder="0" className={dimInput(name)} />
                    {errors[name] && <span className="text-[10px] text-red-500 font-semibold">{errors[name]}</span>}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Billed on higher of actual vs volumetric weight.
              </p>
            </div>

            {/* Type + Payment */}
            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Segment (Rate Card Type)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['B2C', 'B2B'].map(t => (
                    <button key={t} type="button" onClick={() => { setFormData(p => ({ ...p, orderType: t })); setChargeData(null); }}
                      className={`py-2.5 rounded-xl text-sm font-black border-2 transition-all ${formData.orderType === t
                        ? t === 'B2C' ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300'
                                      : 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ v: 'PREPAID', l: 'Prepaid' }, { v: 'COD', l: 'Cash on Delivery' }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => { setFormData(p => ({ ...p, paymentType: v })); setChargeData(null); }}
                      className={`py-2.5 rounded-xl text-xs font-black border-2 transition-all ${formData.paymentType === v
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={calculating || fetchingCustomers} className="btn-primary w-full md:w-auto">
              <Calculator className="w-4 h-4" />
              {calculating ? 'Calculating...' : 'Calculate Delivery Charge'}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 animate-slide-up delay-200">
          {chargeData ? (
            <>
              <ChargePreview chargeData={chargeData} />
              <button onClick={handleConfirm} disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50">
                <ClipboardCheck className="w-5 h-5" />
                {submitting ? 'Creating Order...' : 'Confirm & Create Order'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <div className="glass-card rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
              <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-semibold">Calculate charges to view rate breakdown and confirm the booking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOrderBehalf;
