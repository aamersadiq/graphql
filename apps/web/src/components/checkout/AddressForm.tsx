import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';

interface AddressFormProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
}

export default function AddressForm({ register, errors, watch }: AddressFormProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="form-label">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            className="form-input"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="form-error">{errors.firstName.message as string}</p>
          )}
        </div>
        
        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="form-label">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            className="form-input"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="form-error">{errors.lastName.message as string}</p>
          )}
        </div>
        
        {/* Email */}
        <div>
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            {...register('email')}
          />
          {errors.email && (
            <p className="form-error">{errors.email.message as string}</p>
          )}
        </div>
        
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            className="form-input"
            {...register('phone')}
          />
          {errors.phone && (
            <p className="form-error">{errors.phone.message as string}</p>
          )}
        </div>
        
        {/* Address */}
        <div className="md:col-span-2">
          <label htmlFor="address" className="form-label">
            Address
          </label>
          <input
            id="address"
            type="text"
            className="form-input"
            {...register('address')}
          />
          {errors.address && (
            <p className="form-error">{errors.address.message as string}</p>
          )}
        </div>
        
        {/* City */}
        <div>
          <label htmlFor="city" className="form-label">
            City
          </label>
          <input
            id="city"
            type="text"
            className="form-input"
            {...register('city')}
          />
          {errors.city && (
            <p className="form-error">{errors.city.message as string}</p>
          )}
        </div>
        
        {/* State/Province */}
        <div>
          <label htmlFor="state" className="form-label">
            State/Province
          </label>
          <input
            id="state"
            type="text"
            className="form-input"
            {...register('state')}
          />
          {errors.state && (
            <p className="form-error">{errors.state.message as string}</p>
          )}
        </div>
        
        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="form-label">
            Postal Code
          </label>
          <input
            id="postalCode"
            type="text"
            className="form-input"
            {...register('postalCode')}
          />
          {errors.postalCode && (
            <p className="form-error">{errors.postalCode.message as string}</p>
          )}
        </div>
        
        {/* Country */}
        <div>
          <label htmlFor="country" className="form-label">
            Country
          </label>
          <select
            id="country"
            className="form-input"
            {...register('country')}
          >
            <option value="">Select Country</option>
            <option value="AU">Australia</option>
            <option value="CA">Canada</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="NZ">New Zealand</option>
          </select>
          {errors.country && (
            <p className="form-error">{errors.country.message as string}</p>
          )}
        </div>
      </div>
      
      {/* Shipping Method */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Shipping Method</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="shipping-standard"
              type="radio"
              value="standard"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              {...register('shippingMethod')}
              defaultChecked
            />
            <label htmlFor="shipping-standard" className="ml-3">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Standard Shipping
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                4-5 business days - Free
              </span>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="shipping-express"
              type="radio"
              value="express"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              {...register('shippingMethod')}
            />
            <label htmlFor="shipping-express" className="ml-3">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Express Shipping
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                2-3 business days - $9.99
              </span>
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="shipping-overnight"
              type="radio"
              value="overnight"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              {...register('shippingMethod')}
            />
            <label htmlFor="shipping-overnight" className="ml-3">
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Overnight Shipping
              </span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">
                Next business day - $19.99
              </span>
            </label>
          </div>
        </div>
        
        {errors.shippingMethod && (
          <p className="form-error mt-2">{errors.shippingMethod.message as string}</p>
        )}
      </div>
      
      {/* Save Address */}
      <div className="mt-6">
        <div className="flex items-center">
          <input
            id="saveAddress"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            {...register('saveAddress')}
          />
          <label htmlFor="saveAddress" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Save this address for future orders
          </label>
        </div>
      </div>
    </div>
  );
}