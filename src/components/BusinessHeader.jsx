import { useBusinessConfig } from '../config/businessConfig'

const BusinessHeader = () => {
  const { 
    businessName, 
    BusinessIcon, 
    businessType, 
    address, 
    phone, 
    email, 
    website, 
    workingHours, 
    description 
  } = useBusinessConfig()

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full">
          <BusinessIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-blue-600 font-medium capitalize">{businessType}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p className="flex items-center gap-2 mb-2">
            <span className="text-blue-500">📍</span>
            {address}
          </p>
          <p className="flex items-center gap-2 mb-2">
            <span className="text-blue-500">📞</span>
            {phone}
          </p>
          <p className="flex items-center gap-2 mb-2">
            <span className="text-blue-500">📧</span>
            {email}
          </p>
        </div>
        
        <div>
          <p className="flex items-center gap-2 mb-2">
            <span className="text-blue-500">🌐</span>
            <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {website}
            </a>
          </p>
          <p className="flex items-center gap-2 mb-2">
            <span className="text-blue-500">🕒</span>
            {workingHours}
          </p>
        </div>
      </div>
      
      {description && (
        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-gray-700 italic">"{description}"</p>
        </div>
      )}
    </div>
  )
}

export default BusinessHeader
