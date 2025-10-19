import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';

interface PaymentFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
}

export default function PaymentForm({ register, errors, watch }: PaymentFormProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Payment Information</h2>
      
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center">
            <input
              id="card-type-visa"
              name="cardType"
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              defaultChecked
            />
            <label htmlFor="card-type-visa" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Visa
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="card-type-mastercard"
              name="cardType"
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="card-type-mastercard" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mastercard
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="card-type-amex"
              name="cardType"
              type="radio"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="card-type-amex" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              American Express
            </label>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Name */}
        <div className="md:col-span-2">
          <label htmlFor="cardName" className="form-label">
            Name on Card
          </label>
          <input
            id="cardName"
            type="text"
            className="form-input"
            placeholder="John Smith"
            {...register('cardName')}
          />
          {errors.cardName && (
            <p className="form-error">{errors.cardName.message as string}</p>
          )}
        </div>
        
        {/* Card Number */}
        <div className="md:col-span-2">
          <label htmlFor="cardNumber" className="form-label">
            Card Number
          </label>
          <input
            id="cardNumber"
            type="text"
            className="form-input"
            placeholder="1234 5678 9012 3456"
            maxLength={16}
            {...register('cardNumber')}
          />
          {errors.cardNumber && (
            <p className="form-error">{errors.cardNumber.message as string}</p>
          )}
        </div>
        
        {/* Expiry Date */}
        <div>
          <label className="form-label">Expiry Date</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                id="expiryMonth"
                className="form-input"
                {...register('expiryMonth')}
              >
                <option value="">Month</option>
                <option value="01">01 - January</option>
                <option value="02">02 - February</option>
                <option value="03">03 - March</option>
                <option value="04">04 - April</option>
                <option value="05">05 - May</option>
                <option value="06">06 - June</option>
                <option value="07">07 - July</option>
                <option value="08">08 - August</option>
                <option value="09">09 - September</option>
                <option value="10">10 - October</option>
                <option value="11">11 - November</option>
                <option value="12">12 - December</option>
              </select>
              {errors.expiryMonth && (
                <p className="form-error">{errors.expiryMonth.message as string}</p>
              )}
            </div>
            <div>
              <select
                id="expiryYear"
                className="form-input"
                {...register('expiryYear')}
              >
                <option value="">Year</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
                <option value="2030">2030</option>
              </select>
              {errors.expiryYear && (
                <p className="form-error">{errors.expiryYear.message as string}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* CVV */}
        <div>
          <label htmlFor="cvv" className="form-label">
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            className="form-input"
            placeholder="123"
            maxLength={4}
            {...register('cvv')}
          />
          {errors.cvv && (
            <p className="form-error">{errors.cvv.message as string}</p>
          )}
        </div>
      </div>
      
      {/* Save Payment Method */}
      <div className="mt-6">
        <div className="flex items-center">
          <input
            id="savePayment"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            {...register('savePayment')}
          />
          <label htmlFor="savePayment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Save this payment method for future orders
          </label>
        </div>
      </div>
      
      {/* Payment Security Notice */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
        <div className="flex items-center">
          <div className="text-green-500 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Your payment information is encrypted and secure. We never store your full card details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}