import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Trade knowledge base for the chatbot
const tradeKnowledge = {
  tariffs: {
    'tea-india-usa': {
      hsCode: '0902.30',
      baseRate: 6.4,
      additionalDuties: 0,
      description: 'Tea from India to USA'
    },
    'silk-india-germany': {
      hsCode: '5007.90',
      baseRate: 0,
      additionalDuties: 0,
      description: 'Silk fabrics from India to Germany (under EU preferences)'
    },
    'textiles-india-france': {
      hsCode: '6201.92',
      baseRate: 12.0,
      additionalDuties: 0,
      description: 'Textile apparel from India to France'
    }
  },
  products: [
    // Agricultural Products (25)
    'Tea', 'Rice', 'Spices', 'Cotton', 'Coffee', 'Cocoa', 'Sugar', 'Wheat', 'Corn', 'Soybeans',
    'Pulses', 'Nuts', 'Dried Fruits', 'Fresh Fruits', 'Fresh Vegetables', 'Flowers', 'Honey', 'Tobacco',
    'Rubber', 'Jute', 'Coconut', 'Palm Oil', 'Olive Oil', 'Dairy Products', 'Meat Products',
    
    // Textiles & Apparel (30)
    'Silk', 'Textiles', 'Cotton Yarn', 'Wool', 'Synthetic Fabrics', 'Denim', 'Sportswear', 'Formal Wear',
    'Casual Wear', 'Children\'s Clothing', 'Baby Clothing', 'Undergarments', 'Socks', 'Handbags', 'Luggage',
    'Footwear', 'Leather Goods', 'Carpets', 'Rugs', 'Towels', 'Bed Linen', 'Curtains', 'Upholstery Fabric',
    'Industrial Textiles', 'Medical Textiles', 'Technical Textiles', 'Home Textiles', 'Fashion Accessories', 'Belts',
    
    // Chemicals & Pharmaceuticals (35)
    'Pharmaceuticals', 'Generic Drugs', 'Vaccines', 'Medical Devices', 'Surgical Instruments', 'Diagnostics',
    'Chemicals', 'Organic Chemicals', 'Inorganic Chemicals', 'Petrochemicals', 'Fertilizers', 'Pesticides',
    'Dyes', 'Paints', 'Cosmetics', 'Toiletries', 'Essential Oils', 'Flavors', 'Fragrances', 'Plastics',
    'Rubber Products', 'Adhesives', 'Cleaning Products', 'Industrial Gases', 'Laboratory Chemicals', 'Reagents',
    'Biotechnology Products', 'Veterinary Medicines', 'Medical Supplies', 'Hospital Equipment', 'Dental Products',
    'Orthopedic Devices', 'Cardiovascular Devices', 'Diagnostic Equipment', 'Imaging Equipment',
    
    // Engineering & Machinery (40)
    'Engineering Goods', 'Machinery', 'Agricultural Machinery', 'Construction Equipment', 'Machine Tools',
    'Industrial Robots', 'Automotive Parts', 'Engine Parts', 'Transmission Systems', 'Brake Systems',
    'Electrical Equipment', 'Generators', 'Transformers', 'Motors', 'Pumps', 'Valves', 'Compressors',
    'HVAC Systems', 'Refrigeration Equipment', 'Kitchen Appliances', 'Laundry Equipment', 'Power Tools',
    'Hand Tools', 'Welding Equipment', 'Material Handling Equipment', 'Conveyor Systems', 'Packaging Machinery',
    'Printing Machinery', 'Textile Machinery', 'Food Processing Equipment', 'Mining Equipment', 'Oil & Gas Equipment',
    'Renewable Energy Equipment', 'Solar Panels', 'Wind Turbines', 'Battery Storage', 'Power Electronics',
    'Industrial Automation', 'Control Systems', 'Measurement Instruments',
    
    // Electronics & IT (30)
    'Electronics', 'Consumer Electronics', 'Mobile Phones', 'Laptops', 'Tablets', 'Desktop Computers',
    'Computer Peripherals', 'Printers', 'Scanners', 'Monitors', 'Televisions', 'Audio Equipment', 'Cameras',
    'Semiconductors', 'Integrated Circuits', 'Electronic Components', 'Printed Circuit Boards', 'LED Products',
    'Telecommunication Equipment', 'Networking Equipment', 'Software', 'IT Services', 'Cloud Services',
    'Data Center Equipment', 'Security Equipment', 'Surveillance Systems', 'Smart Home Devices', 'Wearable Devices',
    'Gaming Equipment', 'Virtual Reality Equipment',
    
    // Metals & Minerals (25)
    'Gems & Jewelry', 'Gold Jewelry', 'Silver Jewelry', 'Diamond Jewelry', 'Precious Stones', 'Semi-Precious Stones',
    'Steel', 'Iron', 'Aluminum', 'Copper', 'Zinc', 'Lead', 'Nickel', 'Tin', 'Titanium', 'Stainless Steel',
    'Metal Fabrications', 'Pipes', 'Tubes', 'Wires', 'Cables', 'Fasteners', 'Metal Castings', 'Forgings',
    'Minerals', 'Rare Earth Metals',
    
    // Food & Beverages (25)
    'Food Products', 'Processed Foods', 'Bakery Products', 'Confectionery', 'Snacks', 'Beverages', 'Soft Drinks',
    'Mineral Water', 'Alcoholic Beverages', 'Wine', 'Beer', 'Spirits', 'Seafood', 'Fish Products', 'Meat Products',
    'Poultry Products', 'Frozen Foods', 'Canned Foods', 'Organic Foods', 'Health Foods', 'Dietary Supplements',
    'Infant Formula', 'Pet Food', 'Food Ingredients', 'Food Additives'
  ],
  countries: [
    // North America (3)
    'USA', 'Canada', 'Mexico',
    
    // Central America & Caribbean (20)
    'Guatemala', 'Belize', 'El Salvador', 'Honduras', 'Nicaragua', 'Costa Rica', 'Panama',
    'Bahamas', 'Barbados', 'Cuba', 'Dominican Republic', 'Haiti', 'Jamaica', 'Trinidad and Tobago',
    'Antigua and Barbuda', 'Dominica', 'Grenada', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    
    // South America (12)
    'Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Uruguay', 'Paraguay',
    'Bolivia', 'Ecuador', 'Guyana', 'Suriname',
    
    // Europe (44)
    'Germany', 'France', 'UK', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Sweden', 'Poland', 'Belgium',
    'Austria', 'Norway', 'Ireland', 'Denmark', 'Finland', 'Czech Republic', 'Romania', 'Portugal', 'Greece', 'Hungary',
    'Luxembourg', 'Slovakia', 'Belarus', 'Bulgaria', 'Croatia', 'Serbia', 'Slovenia', 'Lithuania', 'Latvia', 'Estonia',
    'Iceland', 'Malta', 'Cyprus', 'Albania', 'North Macedonia', 'Bosnia and Herzegovina', 'Montenegro', 'Moldova', 'Ukraine',
    'Russia', 'Turkey', 'Georgia', 'Armenia', 'Azerbaijan',
    
    // Africa (54)
    'South Africa', 'Nigeria', 'Egypt', 'Kenya', 'Ghana', 'Morocco', 'Tanzania', 'Ethiopia', 'Uganda', 'Algeria',
    'Tunisia', 'Cameroon', 'Ivory Coast', 'Libya', 'Sudan', 'Angola', 'Mozambique', 'Zimbabwe', 'Zambia', 'Senegal',
    'Botswana', 'Mauritius', 'Madagascar', 'Namibia', 'Malawi', 'Rwanda', 'Burkina Faso', 'Mali', 'Niger', 'Chad',
    'Benin', 'Togo', 'Guinea', 'Sierra Leone', 'Liberia', 'Gambia', 'Guinea-Bissau', 'Cape Verde', 'Sao Tome and Principe',
    'Equatorial Guinea', 'Gabon', 'Congo', 'Democratic Republic of Congo', 'Central African Republic', 'South Sudan',
    'Eritrea', 'Djibouti', 'Somalia', 'Seychelles', 'Comoros', 'Mauritania', 'Lesotho', 'Eswatini', 'Burundi',
    
    // Middle East (15)
    'UAE', 'Saudi Arabia', 'Israel', 'Iran', 'Iraq', 'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Jordan',
    'Lebanon', 'Syria', 'Yemen', 'Palestine', 'Afghanistan',
    
    // Asia (48)
    'China', 'Japan', 'India', 'South Korea', 'Indonesia', 'Turkey', 'Saudi Arabia', 'Taiwan', 'Thailand', 'Singapore',
    'Malaysia', 'Philippines', 'Pakistan', 'Bangladesh', 'Vietnam', 'Israel', 'Hong Kong', 'Myanmar', 'Sri Lanka', 'Kuwait',
    'Iraq', 'Oman', 'Qatar', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan', 'Azerbaijan', 'Georgia',
    'Armenia', 'Bahrain', 'Jordan', 'Lebanon', 'Syria', 'Yemen', 'Cyprus', 'Maldives', 'Bhutan', 'Nepal',
    'Mongolia', 'North Korea', 'Laos', 'Cambodia', 'Brunei', 'Timor-Leste', 'Palestine', 'Afghanistan',
    
    // Oceania (14)
    'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Kiribati',
    'Tonga', 'Micronesia', 'Palau', 'Marshall Islands', 'Nauru', 'Tuvalu'
  ],
  // Enhanced document requirements knowledge base
  documentRequirements: {
    'silk-india-usa': {
      product: 'Silk',
      origin: 'India',
      destination: 'USA',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed invoice with product description, value, and terms'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Proof of shipment and title to goods'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof that goods originate from India'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information including weights and dimensions'
        },
        {
          name: 'Import License',
          required: false,
          description: 'May be required depending on silk type and value'
        },
        {
          name: 'Textile Declaration',
          required: true,
          description: 'FCC textile declaration for silk products'
        }
      ],
      hsCode: '5007.90',
      specialNotes: 'Silk products from India may qualify for preferential duty rates under certain trade agreements.'
    },
    'textiles-india-germany': {
      product: 'Textiles',
      origin: 'India',
      destination: 'Germany',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Must include fiber composition and weight'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Required for preferential treatment under EU-India trade agreement'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing with roll numbers and weights'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Ocean or air freight documentation'
        },
        {
          name: 'EU Textile Label',
          required: true,
          description: 'Mandatory fiber composition label in German/English'
        },
        {
          name: 'REACH Compliance',
          required: true,
          description: 'Chemical safety compliance certificate'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'German customs import declaration'
        }
      ],
      hsCode: '6201.92',
      specialNotes: 'Germany has strict labeling requirements for textile products. All labels must be in German and English.'
    },
    'agricultural-india-uk': {
      product: 'Agricultural Products',
      origin: 'India',
      destination: 'UK',
      documents: [
        {
          name: 'Phytosanitary Certificate',
          required: true,
          description: 'Plant health certificate from Indian authorities'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed product description and value'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Health Certificate',
          required: true,
          description: 'Food safety and health certification'
        },
        {
          name: 'Import License',
          required: false,
          description: 'May be required for certain agricultural products'
        },
        {
          name: 'Organic Certificate',
          required: false,
          description: 'Required if products are certified organic'
        }
      ],
      hsCode: '0701.90',
      specialNotes: 'UK has strict import controls on agricultural products post-Brexit. Additional inspections may be required.'
    },
    'agricultural-india-uae': {
      product: 'Agricultural Products',
      origin: 'India',
      destination: 'UAE',
      documents: [
        {
          name: 'Halal Certificate',
          required: true,
          description: 'Required for all food products entering UAE'
        },
        {
          name: 'Health Certificate',
          required: true,
          description: 'Food safety certification'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed invoice with product specifications'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Import Permit',
          required: true,
          description: 'UAE import permit for food products'
        }
      ],
      hsCode: '0701.90',
      specialNotes: 'UAE requires Halal certification for all food products. Products must comply with GCC food standards.'
    },
    'chemicals-india-usa': {
      product: 'Chemicals',
      origin: 'India',
      destination: 'USA',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed chemical composition and specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'MSDS (Material Safety Data Sheet)',
          required: true,
          description: 'Safety data sheet for chemical products'
        },
        {
          name: 'EPA Certification',
          required: true,
          description: 'Environmental Protection Agency certification'
        },
        {
          name: 'Import License',
          required: false,
          description: 'May be required for certain chemicals'
        },
        {
          name: 'Hazardous Materials Declaration',
          required: true,
          description: 'Required for hazardous chemicals'
        }
      ],
      hsCode: '2934.99',
      specialNotes: 'USA has strict regulations for chemical imports. EPA and TSCA compliance is mandatory.'
    },
    'machinery-india-australia': {
      product: 'Machinery',
      origin: 'India',
      destination: 'Australia',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed machinery specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing with weights and dimensions'
        },
        {
          name: 'Inspection Certificate',
          required: true,
          description: 'Pre-shipment inspection certificate'
        },
        {
          name: 'Electrical Compliance',
          required: true,
          description: 'Australian electrical safety compliance'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'Australian customs import declaration'
        }
      ],
      hsCode: '8479.90',
      specialNotes: 'Australia has strict electrical safety standards. All machinery must comply with Australian standards.'
    },
    // Additional document requirements for major product-country combinations
    'pharmaceuticals-india-usa': {
      product: 'Pharmaceuticals',
      origin: 'India',
      destination: 'USA',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed product description and value'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'FDA Approval',
          required: true,
          description: 'US Food and Drug Administration approval'
        },
        {
          name: 'GMP Certificate',
          required: true,
          description: 'Good Manufacturing Practices certificate'
        },
        {
          name: 'Product Registration',
          required: true,
          description: 'FDA product registration'
        },
        {
          name: 'Labeling Compliance',
          required: true,
          description: 'US labeling requirements compliance'
        },
        {
          name: 'Import License',
          required: false,
          description: 'May be required for certain pharmaceuticals'
        }
      ],
      hsCode: '3004.90',
      specialNotes: 'USA has stringent FDA requirements for pharmaceutical imports. All products must be FDA approved.'
    },
    'electronics-china-usa': {
      product: 'Electronics',
      origin: 'China',
      destination: 'USA',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed product specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Chinese origin'
        },
        {
          name: 'FCC Certification',
          required: true,
          description: 'Federal Communications Commission certification'
        },
        {
          name: 'UL Certification',
          required: true,
          description: 'Underwriters Laboratories safety certification'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'US customs import declaration'
        },
        {
          name: 'Trade Agreement Documentation',
          required: false,
          description: 'May be required for preferential treatment'
        }
      ],
      hsCode: '8517.12',
      specialNotes: 'Electronics from China require FCC and UL certifications. Additional tariffs may apply.'
    },
    'automotive-parts-germany-usa': {
      product: 'Automotive Parts',
      origin: 'Germany',
      destination: 'USA',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed automotive part specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of German origin'
        },
        {
          name: 'DOT Certification',
          required: true,
          description: 'Department of Transportation certification'
        },
        {
          name: 'EPA Compliance',
          required: true,
          description: 'Environmental Protection Agency compliance'
        },
        {
          name: 'Quality Certificate',
          required: true,
          description: 'ISO/TS 16949 quality certification'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'US customs import declaration'
        }
      ],
      hsCode: '8708.99',
      specialNotes: 'Automotive parts require DOT and EPA compliance. German parts generally have high quality standards.'
    },
    'agricultural-brazil-china': {
      product: 'Agricultural Products',
      origin: 'Brazil',
      destination: 'China',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed product description'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Brazilian origin'
        },
        {
          name: 'Phytosanitary Certificate',
          required: true,
          description: 'Plant health certificate'
        },
        {
          name: 'Health Certificate',
          required: true,
          description: 'Food safety certificate'
        },
        {
          name: 'Import License',
          required: true,
          description: 'Chinese import license'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Inspection Certificate',
          required: true,
          description: 'Pre-shipment inspection certificate'
        }
      ],
      hsCode: '1201.00',
      specialNotes: 'China has strict import requirements for agricultural products. Inspection and certification are mandatory.'
    },
    'textiles-bangladesh-uk': {
      product: 'Textiles',
      origin: 'Bangladesh',
      destination: 'UK',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed textile specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Bangladeshi origin'
        },
        {
          name: 'Textile Declaration',
          required: true,
          description: 'UK textile declaration'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'UK customs import declaration'
        },
        {
          name: 'Compliance Certificate',
          required: true,
          description: 'UK product compliance certificate'
        },
        {
          name: 'Labeling Documentation',
          required: true,
          description: 'UK labeling requirements'
        }
      ],
      hsCode: '6204.63',
      specialNotes: 'UK has specific labeling requirements for textiles post-Brexit. Compliance with UK standards is essential.'
    },
    'gems-jewelry-india-uae': {
      product: 'Gems & Jewelry',
      origin: 'India',
      destination: 'UAE',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed jewelry description and value'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Indian origin'
        },
        {
          name: 'Hallmark Certificate',
          required: true,
          description: 'Gold purity hallmark certificate'
        },
        {
          name: 'Gemstone Certificate',
          required: true,
          description: 'Gemstone authenticity certificate'
        },
        {
          name: 'Insurance Certificate',
          required: true,
          description: 'Insurance coverage for valuable items'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import License',
          required: false,
          description: 'May be required for certain jewelry items'
        }
      ],
      hsCode: '7113.19',
      specialNotes: 'UAE has specific requirements for precious metals and stones. Hallmarking is mandatory for gold jewelry.'
    },
    'machinery-japan-australia': {
      product: 'Machinery',
      origin: 'Japan',
      destination: 'Australia',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed machinery specifications'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Japanese origin'
        },
        {
          name: 'Inspection Certificate',
          required: true,
          description: 'Pre-shipment inspection certificate'
        },
        {
          name: 'Australian Standards Compliance',
          required: true,
          description: 'Australian standards compliance certificate'
        },
        {
          name: 'Electrical Safety Certificate',
          required: true,
          description: 'Australian electrical safety certification'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'Australian customs import declaration'
        }
      ],
      hsCode: '8479.90',
      specialNotes: 'Australia has strict machinery safety standards. Japanese machinery generally meets high quality standards.'
    },
    'coffee-colombia-germany': {
      product: 'Coffee',
      origin: 'Colombia',
      destination: 'Germany',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed coffee description and grade'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Colombian origin'
        },
        {
          name: 'Phytosanitary Certificate',
          required: true,
          description: 'Plant health certificate'
        },
        {
          name: 'Quality Certificate',
          required: true,
          description: 'Coffee quality grade certificate'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Import Declaration',
          required: true,
          description: 'German customs import declaration'
        },
        {
          name: 'Organic Certificate',
          required: false,
          description: 'Required if coffee is certified organic'
        }
      ],
      hsCode: '0901.11',
      specialNotes: 'Germany has high quality standards for coffee imports. Colombian coffee generally receives preferential treatment.'
    },
    'seafood-norway-japan': {
      product: 'Seafood',
      origin: 'Norway',
      destination: 'Japan',
      documents: [
        {
          name: 'Commercial Invoice',
          required: true,
          description: 'Detailed seafood description'
        },
        {
          name: 'Bill of Lading',
          required: true,
          description: 'Shipping documentation'
        },
        {
          name: 'Certificate of Origin',
          required: true,
          description: 'Proof of Norwegian origin'
        },
        {
          name: 'Health Certificate',
          required: true,
          description: 'Food safety and health certificate'
        },
        {
          name: 'Import License',
          required: true,
          description: 'Japanese import license for seafood'
        },
        {
          name: 'Packing List',
          required: true,
          description: 'Detailed packing information'
        },
        {
          name: 'Cold Chain Documentation',
          required: true,
          description: 'Temperature control documentation'
        },
        {
          name: 'Inspection Certificate',
          required: true,
          description: 'Pre-shipment inspection certificate'
        }
      ],
      hsCode: '0303.11',
      specialNotes: 'Japan has strict requirements for seafood imports. Cold chain maintenance is critical for fresh seafood.'
    }
  },
  // Profit analysis data
  profitAnalysis: {
    'usa': {
      country: 'USA',
      currency: 'USD',
      marketSize: '$25.5 trillion',
      topProducts: [
        {
          product: 'Pharmaceuticals',
          profitMargin: '25-35%',
          demand: 'Very High',
          competition: 'High',
          keyFactors: ['FDA approval', 'Patent protection', 'Quality standards']
        },
        {
          product: 'Engineering Goods',
          profitMargin: '18-25%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Quality certification', 'After-sales service', 'Technical support']
        },
        {
          product: 'Textiles',
          profitMargin: '15-20%',
          demand: 'Medium',
          competition: 'Very High',
          keyFactors: ['Brand recognition', 'Design innovation', 'Supply chain efficiency']
        },
        {
          product: 'Gems & Jewelry',
          profitMargin: '30-40%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Design uniqueness', 'Quality certification', 'Marketing strategy']
        },
        {
          product: 'Chemicals',
          profitMargin: '20-28%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Environmental compliance', 'Product consistency', 'Logistics efficiency']
        }
      ],
      insights: [
        'USA has high demand for quality pharmaceutical products with strict regulatory requirements',
        'Engineering goods market is growing with focus on automation and smart manufacturing',
        'Textile market is competitive but offers opportunities in sustainable and technical textiles',
        'Gems and jewelry market values design innovation and ethical sourcing'
      ]
    },
    'canada': {
      country: 'Canada',
      currency: 'CAD',
      marketSize: '$2.2 trillion',
      topProducts: [
        {
          product: 'Agricultural Products',
          profitMargin: '12-18%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Food safety', 'Organic certification', 'Seasonal supply']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '22-30%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Health Canada approval', 'Bilingual labeling', 'Quality assurance']
        },
        {
          product: 'Engineering Goods',
          profitMargin: '16-22%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Cold climate specifications', 'Energy efficiency', 'Local standards']
        },
        {
          product: 'Textiles',
          profitMargin: '14-18%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Winter clothing', 'Sustainable materials', 'Bilingual packaging']
        },
        {
          product: 'Chemicals',
          profitMargin: '18-25%',
          demand: 'Medium',
          competition: 'Low',
          keyFactors: ['Environmental standards', 'Cold weather formulations', 'Safety compliance']
        }
      ],
      insights: [
        'Canada has strict requirements for agricultural products with focus on food safety',
        'Pharmaceutical market requires Health Canada approval and bilingual labeling',
        'Engineering goods must meet Canadian standards and cold weather specifications',
        'Textile market has strong demand for winter clothing and sustainable materials'
      ]
    },
    'australia': {
      country: 'Australia',
      currency: 'AUD',
      marketSize: '$1.7 trillion',
      topProducts: [
        {
          product: 'Pharmaceuticals',
          profitMargin: '24-32%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['TGA approval', 'Quality standards', 'Therapeutic goods registration']
        },
        {
          product: 'Engineering Goods',
          profitMargin: '20-26%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Australian standards', 'Mining industry needs', 'After-sales support']
        },
        {
          product: 'Agricultural Products',
          profitMargin: '15-22%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Biosecurity', 'Seasonal supply', 'Quality certification']
        },
        {
          product: 'Chemicals',
          profitMargin: '18-24%',
          demand: 'Medium',
          competition: 'Low',
          keyFactors: ['Environmental safety', 'Mining industry applications', 'Quality control']
        },
        {
          product: 'Textiles',
          profitMargin: '16-20%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['UV protection', 'Sustainable materials', 'Outdoor clothing']
        }
      ],
      insights: [
        'Australia has strong demand for pharmaceuticals with TGA approval requirements',
        'Engineering goods market is driven by mining and construction industries',
        'Agricultural products must meet strict biosecurity requirements',
        'Chemical market focuses on mining and industrial applications'
      ]
    },
    'china': {
      country: 'China',
      currency: 'CNY',
      marketSize: '$17.7 trillion',
      topProducts: [
        {
          product: 'Electronics',
          profitMargin: '15-25%',
          demand: 'Very High',
          competition: 'Very High',
          keyFactors: ['Technology innovation', 'Supply chain integration', 'Cost efficiency']
        },
        {
          product: 'Machinery',
          profitMargin: '12-20%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Quality standards', 'After-sales service', 'Technology transfer']
        },
        {
          product: 'Automotive Parts',
          profitMargin: '10-18%',
          demand: 'High',
          competition: 'Very High',
          keyFactors: ['Local partnerships', 'Technology adaptation', 'Cost competitiveness']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '20-30%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['CFDA approval', 'Clinical trials', 'Distribution network']
        },
        {
          product: 'Agricultural Products',
          profitMargin: '8-15%',
          demand: 'Very High',
          competition: 'Medium',
          keyFactors: ['Food safety', 'Quality standards', 'Supply chain reliability']
        }
      ],
      insights: [
        'China has massive consumer market with growing middle class',
        'Electronics and machinery sectors are highly competitive but offer scale opportunities',
        'Regulatory environment requires careful navigation and local partnerships',
        'Agricultural imports are growing due to food security concerns'
      ]
    },
    'japan': {
      country: 'Japan',
      currency: 'JPY',
      marketSize: '$4.9 trillion',
      topProducts: [
        {
          product: 'Electronics',
          profitMargin: '18-28%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Quality excellence', 'Technology leadership', 'Brand reputation']
        },
        {
          product: 'Automotive Parts',
          profitMargin: '15-25%',
          demand: 'Very High',
          competition: 'High',
          keyFactors: ['Just-in-time delivery', 'Quality certification', 'Long-term partnerships']
        },
        {
          product: 'Machinery',
          profitMargin: '12-22%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Precision engineering', 'Reliability', 'Technical support']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '22-32%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['PMDA approval', 'Clinical data', 'Distribution network']
        },
        {
          product: 'Food Products',
          profitMargin: '10-18%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Quality standards', 'Food safety', 'Packaging innovation']
        }
      ],
      insights: [
        'Japan demands highest quality standards and precision',
        'Long-term business relationships are crucial for success',
        'Automotive and electronics sectors offer premium positioning opportunities',
        'Regulatory approval process is thorough but predictable'
      ]
    },
    'germany': {
      country: 'Germany',
      currency: 'EUR',
      marketSize: '$4.3 trillion',
      topProducts: [
        {
          product: 'Machinery',
          profitMargin: '20-30%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Engineering excellence', 'Innovation', 'Quality certification']
        },
        {
          product: 'Automotive Parts',
          profitMargin: '18-28%',
          demand: 'Very High',
          competition: 'Very High',
          keyFactors: ['Technical standards', 'Quality management', 'Supply chain integration']
        },
        {
          product: 'Chemicals',
          profitMargin: '15-25%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Environmental compliance', 'Technical specifications', 'Safety standards']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '22-35%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['BfArM approval', 'Clinical trials', 'Quality assurance']
        },
        {
          product: 'Electronics',
          profitMargin: '12-20%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Technical standards', 'Innovation', 'Quality certification']
        }
      ],
      insights: [
        'Germany values engineering excellence and technical precision',
        'Automotive sector offers premium positioning for quality components',
        'Environmental and quality standards are among the highest globally',
        'Long-term partnerships and reliability are highly valued'
      ]
    },
    'uk': {
      country: 'UK',
      currency: 'GBP',
      marketSize: '$3.1 trillion',
      topProducts: [
        {
          product: 'Pharmaceuticals',
          profitMargin: '25-35%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['MHRA approval', 'Clinical trials', 'NHS compliance']
        },
        {
          product: 'Financial Services',
          profitMargin: '20-30%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Regulatory compliance', 'Technology innovation', 'Market expertise']
        },
        {
          product: 'Engineering Goods',
          profitMargin: '15-25%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Quality standards', 'Technical specifications', 'After-sales support']
        },
        {
          product: 'Chemicals',
          profitMargin: '12-22%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Environmental compliance', 'Safety standards', 'Quality control']
        },
        {
          product: 'Food Products',
          profitMargin: '10-18%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Food safety', 'Quality standards', 'Supply chain traceability']
        }
      ],
      insights: [
        'UK has strong pharmaceutical and financial services sectors',
        'Post-Brexit regulatory environment requires careful navigation',
        'Quality and compliance are paramount for market access',
        'Consumer market values quality and innovation'
      ]
    },
    'brazil': {
      country: 'Brazil',
      currency: 'BRL',
      marketSize: '$2.1 trillion',
      topProducts: [
        {
          product: 'Agricultural Products',
          profitMargin: '15-25%',
          demand: 'Very High',
          competition: 'Medium',
          keyFactors: ['Scale efficiency', 'Supply chain logistics', 'Quality certification']
        },
        {
          product: 'Mining Equipment',
          profitMargin: '18-28%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Technical specifications', 'After-sales support', 'Local partnerships']
        },
        {
          product: 'Automotive Parts',
          profitMargin: '12-22%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Cost competitiveness', 'Local manufacturing', 'Quality standards']
        },
        {
          product: 'Chemicals',
          profitMargin: '15-25%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Environmental compliance', 'Technical support', 'Distribution network']
        },
        {
          product: 'Machinery',
          profitMargin: '10-20%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Financing options', 'Technical support', 'Local service network']
        }
      ],
      insights: [
        'Brazil offers massive agricultural market with global export potential',
        'Mining and infrastructure sectors present significant opportunities',
        'Local manufacturing partnerships are increasingly important',
        'Economic volatility requires careful risk management'
      ]
    },
    'india': {
      country: 'India',
      currency: 'INR',
      marketSize: '$3.7 trillion',
      topProducts: [
        {
          product: 'Pharmaceuticals',
          profitMargin: '20-30%',
          demand: 'Very High',
          competition: 'High',
          keyFactors: ['CDSCO approval', 'Price competitiveness', 'Distribution network']
        },
        {
          product: 'Engineering Goods',
          profitMargin: '15-25%',
          demand: 'High',
          competition: 'Very High',
          keyFactors: ['Cost efficiency', 'Quality standards', 'After-sales service']
        },
        {
          product: 'Textiles',
          profitMargin: '12-20%',
          demand: 'Very High',
          competition: 'Very High',
          keyFactors: ['Scale production', 'Design innovation', 'Supply chain efficiency']
        },
        {
          product: 'Chemicals',
          profitMargin: '15-25%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Environmental compliance', 'Technical specifications', 'Cost competitiveness']
        },
        {
          product: 'Electronics',
          profitMargin: '10-18%',
          demand: 'Very High',
          competition: 'Very High',
          keyFactors: ['Price competitiveness', 'Technology adaptation', 'Local partnerships']
        }
      ],
      insights: [
        'India has rapidly growing consumer market with digital adoption',
        'Pharmaceutical sector offers strong export opportunities',
        'Price sensitivity requires careful positioning strategies',
        'Government initiatives support manufacturing and exports'
      ]
    },
    'uae': {
      country: 'UAE',
      currency: 'AED',
      marketSize: '$421 billion',
      topProducts: [
        {
          product: 'Gems & Jewelry',
          profitMargin: '25-40%',
          demand: 'Very High',
          competition: 'Medium',
          keyFactors: ['Quality certification', 'Design innovation', 'Market positioning']
        },
        {
          product: 'Electronics',
          profitMargin: '15-25%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Technology leadership', 'Brand reputation', 'Distribution network']
        },
        {
          product: 'Machinery',
          profitMargin: '18-28%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['Technical specifications', 'After-sales support', 'Regional hub strategy']
        },
        {
          product: 'Chemicals',
          profitMargin: '12-22%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Quality standards', 'Environmental compliance', 'Regional distribution']
        },
        {
          product: 'Food Products',
          profitMargin: '10-20%',
          demand: 'Very High',
          competition: 'High',
          keyFactors: ['Halal certification', 'Quality standards', 'Supply chain reliability']
        }
      ],
      insights: [
        'UAE serves as strategic hub for Middle East and Africa markets',
        'Luxury goods and high-value products have strong demand',
        'Free zones offer significant business advantages',
        'Quality and certification requirements are stringent'
      ]
    },
    'singapore': {
      country: 'Singapore',
      currency: 'SGD',
      marketSize: '$397 billion',
      topProducts: [
        {
          product: 'Electronics',
          profitMargin: '15-25%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Technology innovation', 'Quality standards', 'Regional hub positioning']
        },
        {
          product: 'Chemicals',
          profitMargin: '18-28%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Technical specifications', 'Environmental compliance', 'Regional distribution']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '22-32%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['HSA approval', 'Quality assurance', 'Regional headquarters']
        },
        {
          product: 'Machinery',
          profitMargin: '12-22%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Technical support', 'Regional service center', 'Quality certification']
        },
        {
          product: 'Financial Services',
          profitMargin: '20-35%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Regulatory compliance', 'Technology innovation', 'Regional expertise']
        }
      ],
      insights: [
        'Singapore is premier regional hub for Southeast Asia',
        'Strong intellectual property protection and business environment',
        'Strategic location for regional distribution and management',
        'High-quality standards and regulatory efficiency'
      ]
    },
    'southkorea': {
      country: 'South Korea',
      currency: 'KRW',
      marketSize: '$1.8 trillion',
      topProducts: [
        {
          product: 'Electronics',
          profitMargin: '15-25%',
          demand: 'Very High',
          competition: 'Very High',
          keyFactors: ['Technology leadership', 'Quality excellence', 'Innovation speed']
        },
        {
          product: 'Automotive Parts',
          profitMargin: '12-22%',
          demand: 'High',
          competition: 'High',
          keyFactors: ['Quality standards', 'Technical specifications', 'Supply chain integration']
        },
        {
          product: 'Machinery',
          profitMargin: '10-20%',
          demand: 'Medium',
          competition: 'High',
          keyFactors: ['Technical innovation', 'Quality certification', 'After-sales support']
        },
        {
          product: 'Chemicals',
          profitMargin: '15-25%',
          demand: 'Medium',
          competition: 'Medium',
          keyFactors: ['Technical specifications', 'Environmental compliance', 'Quality control']
        },
        {
          product: 'Pharmaceuticals',
          profitMargin: '20-30%',
          demand: 'High',
          competition: 'Medium',
          keyFactors: ['MFDS approval', 'Clinical trials', 'Quality assurance']
        }
      ],
      insights: [
        'South Korea has advanced technology and manufacturing capabilities',
        'Electronics and automotive sectors are highly competitive',
        'Quality and innovation are critical for market success',
        'Strong domestic market with export orientation'
      ]
    }
  },
  riskFactors: {
    political: {
      brazil: 75,
      china: 65,
      russia: 85,
      india: 60,
      germany: 15,
      usa: 40
    },
    economic: {
      brazil: 70,
      china: 55,
      russia: 80,
      india: 65,
      germany: 25,
      usa: 35
    }
  }
};

// Performance optimizations for expanded database
const productIndex: { [key: string]: string } = {};
const countryIndex: { [key: string]: string } = {};
const countryAliases: { [key: string]: string } = {
  'usa': 'usa', 'us': 'usa', 'america': 'usa', 'united states': 'usa',
  'uk': 'uk', 'britain': 'uk', 'united kingdom': 'uk', 'england': 'uk',
  'uae': 'uae', 'dubai': 'uae', 'emirates': 'uae',
  'canadian': 'canada', 'canada': 'canada',
  'australian': 'australia', 'australia': 'australia',
  'china': 'china', 'chinese': 'china',
  'japan': 'japan', 'japanese': 'japan',
  'germany': 'germany', 'german': 'germany',
  'france': 'france', 'french': 'france',
  'italy': 'italy', 'italian': 'italy',
  'spain': 'spain', 'spanish': 'spain',
  'brazil': 'brazil', 'brazilian': 'brazil',
  'india': 'india', 'indian': 'india',
  'russia': 'russia', 'russian': 'russia',
  'mexico': 'mexico', 'mexican': 'mexico',
  'south korea': 'southkorea', 'korea': 'southkorea', 'korean': 'southkorea',
  'singapore': 'singapore', 'singaporean': 'singapore'
};

// Build indexes for faster lookup
function buildIndexes() {
  // Build product index
  tradeKnowledge.products.forEach(product => {
    const key = product.toLowerCase();
    productIndex[key] = product;
    
    // Add common variations
    if (product.includes(' ')) {
      const words = product.split(' ');
      words.forEach(word => {
        if (word.length > 3) {
          productIndex[word.toLowerCase()] = product;
        }
      });
    }
  });
  
  // Build country index
  tradeKnowledge.countries.forEach(country => {
    const key = country.toLowerCase();
    countryIndex[key] = country;
    
    // Add multi-word countries
    if (country.includes(' ')) {
      const words = country.split(' ');
      words.forEach(word => {
        if (word.length > 2) {
          countryIndex[word.toLowerCase()] = country;
        }
      });
    }
  });
}

// Initialize indexes
buildIndexes();

// Optimized product extraction
function extractProductOptimized(message: string): string | undefined {
  const messageLower = message.toLowerCase();
  
  // First try exact matches from index
  for (const [key, product] of Object.entries(productIndex)) {
    if (messageLower.includes(key)) {
      return product;
    }
  }
  
  // Fallback to partial matching for longer products
  const words = messageLower.split(' ');
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= Math.min(i + 3, words.length); j++) {
      const phrase = words.slice(i, j).join(' ');
      if (productIndex[phrase]) {
        return productIndex[phrase];
      }
    }
  }
  
  return undefined;
}

// Optimized country extraction
function extractCountryOptimized(message: string): { origin?: string, destination?: string } {
  const messageLower = message.toLowerCase();
  let origin: string | undefined;
  let destination: string | undefined;
  
  // Check for country names and aliases
  for (const [alias, country] of Object.entries(countryAliases)) {
    if (messageLower.includes(alias)) {
      const countryObj = countryIndex[country] || country;
      
      // Determine if origin or destination based on context
      const exportFromIndex = messageLower.indexOf('export from');
      const exportToIndex = messageLower.indexOf('export to');
      const fromIndex = messageLower.indexOf(' from ');
      const toIndex = messageLower.indexOf(' to ');
      const aliasIndex = messageLower.indexOf(alias);
      
      if (exportFromIndex !== -1 && exportFromIndex < aliasIndex) {
        origin = countryObj;
      } else if (exportToIndex !== -1 && exportToIndex < aliasIndex) {
        destination = countryObj;
      } else if (fromIndex !== -1 && fromIndex < aliasIndex) {
        origin = countryObj;
      } else if (toIndex !== -1 && toIndex < aliasIndex) {
        destination = countryObj;
      } else if (!origin) {
        origin = countryObj;
      } else if (!destination) {
        destination = countryObj;
      }
    }
  }
  
  // Check direct country names
  for (const [key, country] of Object.entries(countryIndex)) {
    if (messageLower.includes(key) && !countryAliases[key]) {
      const countryIndexInMessage = messageLower.indexOf(key);
      
      // Determine if origin or destination based on context
      const exportFromIndex = messageLower.indexOf('export from');
      const exportToIndex = messageLower.indexOf('export to');
      const fromIndex = messageLower.indexOf(' from ');
      const toIndex = messageLower.indexOf(' to ');
      
      if (exportFromIndex !== -1 && exportFromIndex < countryIndexInMessage) {
        origin = country;
      } else if (exportToIndex !== -1 && exportToIndex < countryIndexInMessage) {
        destination = country;
      } else if (fromIndex !== -1 && fromIndex < countryIndexInMessage) {
        origin = country;
      } else if (toIndex !== -1 && toIndex < countryIndexInMessage) {
        destination = country;
      } else if (!origin) {
        origin = country;
      } else if (!destination) {
        destination = country;
      }
    }
  }
  
  return { origin, destination };
}

// Helper functions for enhanced chatbot functionality
function getDocumentRequirements(product: string, origin: string, destination: string): any {
  const key = `${product.toLowerCase()}-${origin.toLowerCase()}-${destination.toLowerCase()}`;
  return tradeKnowledge.documentRequirements[key];
}

function getProfitAnalysis(country: string): any {
  return tradeKnowledge.profitAnalysis[country.toLowerCase()];
}

function extractProductAndCountry(message: string): { product?: string, origin?: string, destination?: string } {
  // Use optimized functions for better performance
  const product = extractProductOptimized(message);
  const { origin, destination } = extractCountryOptimized(message);
  
  return { product, origin, destination };
}

function generateDocumentResponse(product: string, origin: string, destination: string): string {
  const requirements = getDocumentRequirements(product, origin, destination);
  
  if (!requirements) {
    return `I don't have specific document requirements for ${product} from ${origin} to ${destination} in my current database. However, I can provide general guidance:

**General Trade Documents Required:**
• Commercial Invoice
• Bill of Lading or Air Waybill
• Certificate of Origin
• Packing List
• Insurance Certificate

**Product-Specific Documents:**
• **Agricultural Products**: Phytosanitary Certificate, Health Certificate
• **Textiles**: Textile Declaration, Labeling Compliance
• **Chemicals**: MSDS, Safety Certificates
• **Machinery**: Inspection Certificate, Compliance Documentation

Would you like me to help you with specific requirements for a different product or route?`;
  }
  
  let response = `**Trade Documents Required for ${requirements.product} from ${requirements.origin} to ${requirements.destination}**

**HS Code:** ${requirements.hsCode}

**Required Documents:**
`;
  
  requirements.documents.forEach((doc: any) => {
    response += `• **${doc.name}** ${doc.required ? '(Required)' : '(Optional)'}\n  ${doc.description}\n\n`;
  });
  
  if (requirements.specialNotes) {
    response += `**Special Notes:**\n${requirements.specialNotes}\n\n`;
  }
  
  response += `Would you like me to help you generate any of these documents or provide more detailed information about specific requirements?`;
  
  return response;
}

function generateProfitResponse(country: string): string {
  const analysis = getProfitAnalysis(country);
  
  if (!analysis) {
    return `I don't have specific profit analysis for ${country} in my current database. However, I can provide general guidance:

**General Profit Factors for International Trade:**
• Market demand and competition
• Regulatory requirements and compliance costs
• Logistics and shipping costs
• Currency exchange rates
• Trade agreements and tariffs

**High-Profit Product Categories:**
• Pharmaceuticals and medical devices
• Engineering and technical goods
• Specialty chemicals
• High-value textiles
• Agricultural products with certifications

Would you like me to provide profit analysis for a different country (USA, Canada, or Australia)?`;
  }
  
  let response = `**Profit Analysis for Exporting to ${analysis.country}**

**Market Size:** ${analysis.marketSize}
**Currency:** ${analysis.currency}

**Top Profitable Products:**
`;
  
  analysis.topProducts.forEach((product: any, index: number) => {
    response += `${index + 1}. **${product.product}**
   • Profit Margin: ${product.profitMargin}
   • Demand: ${product.demand}
   • Competition: ${product.competition}
   • Key Factors: ${product.keyFactors.join(', ')}
   
`;
  });
  
  response += `**Key Market Insights:**
`;
  
  analysis.insights.forEach((insight: string, index: number) => {
    response += `• ${insight}\n`;
  });
  
  response += `\nWould you like more detailed information about any specific product or market entry strategy?`;
  
  return response;
}

// Language detection and multilingual support
function detectLanguage(message: string): string {
  // Simple language detection based on common words
  const languagePatterns: { [key: string]: string[] } = {
    'es': ['qué', 'cómo', 'dónde', 'cuándo', 'por', 'para', 'documentos', 'exportar', 'importar'],
    'fr': ['quoi', 'comment', 'où', 'quand', 'pour', 'documents', 'exporter', 'importer'],
    'de': ['was', 'wie', 'wo', 'wann', 'für', 'dokumente', 'exportieren', 'importieren'],
    'zh': ['什么', '如何', '哪里', '何时', '为什么', '文件', '出口', '进口'],
    'hi': ['क्या', 'कैसे', 'कहाँ', 'कब', 'क्यों', 'दस्तावेज', 'निर्यात', 'आयात'],
    'ar': ['ماذا', 'كيف', 'أين', 'متى', 'لماذا', 'وثائق', 'تصدير', 'استيراد'],
    'pt': ['o que', 'como', 'onde', 'quando', 'por que', 'documentos', 'exportar', 'importar'],
    'ru': ['что', 'как', 'где', 'когда', 'почему', 'документы', 'экспорт', 'импорт']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    const matches = patterns.filter(pattern => lowerMessage.includes(pattern)).length;
    if (matches >= 2) {
      return lang;
    }
  }
  
  return 'en'; // Default to English
}

function getLanguageResponse(language: string, type: 'document' | 'profit' | 'general'): string {
  const responses: { [key: string]: { [key: string]: string } } = {
    'es': {
      'document': 'Puedo ayudarle con los requisitos de documentos de exportación. Por favor, especifique el producto, país de origen y país de destino.',
      'profit': 'Puedo proporcionar análisis de rentabilidad para diferentes países. ¿Para qué país le gustaría el análisis?',
      'general': 'Soy TradeGenie, su asistente de comercio internacional. ¿Cómo puedo ayudarle hoy?'
    },
    'fr': {
      'document': 'Je peux vous aider avec les exigences en matière de documents d\'exportation. Veuillez spécifier le produit, le pays d\'origine et le pays de destination.',
      'profit': 'Je peux fournir une analyse de rentabilité pour différents pays. Pour quel pays souhaitez-vous l\'analyse ?',
      'general': 'Je suis TradeGenie, votre assistant commercial international. Comment puis-je vous aider aujourd\'hui ?'
    },
    'de': {
      'document': 'Ich kann Ihnen mit den Anforderungen für Exportdokumente helfen. Bitte geben Sie das Produkt, das Herkunftsland und das Zielland an.',
      'profit': 'Ich kann Rentabilitätsanalysen für verschiedene Länder bereitstellen. Für welches Land möchten Sie die Analyse?',
      'general': 'Ich bin TradeGenie, Ihr internationaler Handelsassistent. Wie kann ich Ihnen heute helfen?'
    },
    'zh': {
      'document': '我可以帮助您了解出口文件要求。请指定产品、原产国和目的地国家。',
      'profit': '我可以为不同国家提供盈利能力分析。您想要哪个国家的分析？',
      'general': '我是TradeGenie，您的国际贸易助手。今天我能如何帮助您？'
    },
    'hi': {
      'document': 'मैं आपके निर्यात दस्तावेज़ आवश्यकताओं में आपकी सहायता कर सकता हूं। कृपया उत्पाद, मूल देश और गंतव्य देश निर्दिष्ट करें।',
      'profit': 'मैं विभिन्न देशों के लिए लाभप्रदता विश्लेषण प्रदान कर सकता हूं। आप किस देश के लिए विश्लेषण चाहते हैं?',
      'general': 'मैं TradeGenie हूं, आपका अंतरराष्ट्रीय व्यापार सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?'
    },
    'ar': {
      'document': 'يمكنني مساعدتك في متطلبات وثائق التصدير. يرجى تحديد المنتج والدولة الأصلية والدولة الوجهة.',
      'profit': 'يمكنني توفير تحليل الربحية لبلدان مختلفة. لأي country تريد التحليل؟',
      'general': 'أنا TradeGenie، مساعد التجارة الدولية الخاص بك. كيف يمكنني مساعدتك اليوم؟'
    },
    'pt': {
      'document': 'Posso ajudar com os requisitos de documentos de exportação. Por favor, especifique o produto, país de origem e país de destino.',
      'profit': 'Posso fornecer análise de rentabilidade para diferentes países. Para qual país você gostaria da análise?',
      'general': 'Sou TradeGenie, seu assistente de comércio internacional. Como posso ajudar você hoje?'
    },
    'ru': {
      'document': 'Я могу помочь вам с требованиями к экспортным документам. Пожалуйста, укажите товар, страну происхождения и страну назначения.',
      'profit': 'Я могу предоставить анализ рентабельности для разных стран. Для какой страны вы хотели бы анализ?',
      'general': 'Я TradeGenie, ваш помощник по международной торговле. Как я могу помочь вам сегодня?'
    },
    'en': {
      'document': 'I can help you with export document requirements. Please specify the product, origin country, and destination country.',
      'profit': 'I can provide profitability analysis for different countries. Which country would you like the analysis for?',
      'general': 'I\'m TradeGenie, your international trade assistant. How can I help you today?'
    }
  };
  
  return responses[language]?.[type] || responses['en'][type];
}

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { message, language = 'en' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save user message to database
    await db.chatHistory.create({
      data: {
        userId: decodedToken.userId,
        type: 'user',
        content: message,
        language
      }
    });

    // Generate AI response
    let aiResponse = await generateAIResponse(message, language);

    // Save AI response to database
    const savedMessage = await db.chatHistory.create({
      data: {
        userId: decodedToken.userId,
        type: 'assistant',
        content: aiResponse,
        language
      }
    });

    return NextResponse.json({
      message: aiResponse,
      messageId: savedMessage.id,
      timestamp: savedMessage.createdAt
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(userMessage: string, language: string): Promise<string> {
  const message = userMessage.toLowerCase();
  
  // Detect language from message
  const detectedLanguage = detectLanguage(userMessage);
  const responseLanguage = detectedLanguage !== 'en' ? detectedLanguage : language;
  
  // Enhanced document query handling
  if (message.includes('document') || message.includes('certificate') || message.includes('paperwork') || 
      message.includes('required') || message.includes('export') || message.includes('import')) {
    
    const { product, origin, destination } = extractProductAndCountry(userMessage);
    
    if (product && origin && destination) {
      return generateDocumentResponse(product, origin, destination);
    } else if (product || origin || destination) {
      // Partial information detected
      return getLanguageResponse(responseLanguage, 'document');
    }
  }
  
  // Enhanced profit analysis handling
  if (message.includes('profit') || message.includes('lucrative') || message.includes('revenue') || 
      message.includes('money') || message.includes('income') || message.includes('margin')) {
    
    // Extract country for profit analysis
    for (const country of tradeKnowledge.countries) {
      if (message.toLowerCase().includes(country.toLowerCase())) {
        return generateProfitResponse(country);
      }
    }
    
    // Check for country aliases
    const countryAliases: { [key: string]: string } = {
      'usa': 'usa',
      'us': 'usa',
      'america': 'usa',
      'united states': 'usa',
      'uk': 'uk',
      'britain': 'uk',
      'united kingdom': 'uk',
      'canadian': 'canada',
      'australian': 'australia'
    };
    
    for (const [alias, country] of Object.entries(countryAliases)) {
      if (message.toLowerCase().includes(alias)) {
        return generateProfitResponse(country);
      }
    }
    
    return getLanguageResponse(responseLanguage, 'profit');
  }
  
  // Initialize Z-AI SDK for other queries
  try {
    const zai = await ZAI.create();
    
    const systemPrompt = `You are TradeGenie, an AI assistant specializing in international trade. 
    You have extensive knowledge about:
    - Tariffs and trade regulations between countries
    - Risk assessment for international trade
    - Document generation for trade compliance
    - Partner matching and market analysis
    - Trade finance and logistics
    
    Provide accurate, helpful, and concise responses. When specific numbers or rates are requested, 
    provide them with context and sources. Be professional but friendly.
    
    Current user language: ${responseLanguage}
    Respond in the user's language when possible.
    
    Trade Knowledge Base:
    - Products: ${tradeKnowledge.products.join(', ')}
    - Countries: ${tradeKnowledge.countries.join(', ')}
    - Sample Tariffs: ${JSON.stringify(tradeKnowledge.tariffs)}
    - Document Requirements: Available for specific product-country combinations
    - Profit Analysis: Available for USA, Canada, and Australia
    `;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return completion.choices[0]?.message?.content || 
      getLanguageResponse(responseLanguage, 'general');

  } catch (error) {
    console.error('Z-AI SDK error:', error);
    
    // Fallback to rule-based responses
    return generateFallbackResponse(message, responseLanguage);
  }
}

function generateFallbackResponse(message: string, language: string): string {
  // Handle document queries in fallback
  if (message.includes('document') || message.includes('certificate') || message.includes('paperwork')) {
    if (message.includes('silk') && message.includes('india') && message.includes('usa')) {
      return generateDocumentResponse('Silk', 'India', 'USA');
    }
    if (message.includes('textile') && message.includes('germany')) {
      return generateDocumentResponse('Textiles', 'India', 'Germany');
    }
    if (message.includes('agricultural') && message.includes('uk')) {
      return generateDocumentResponse('Agricultural Products', 'India', 'UK');
    }
    return getLanguageResponse(language, 'document');
  }
  
  // Handle profit analysis in fallback
  if (message.includes('profit') || message.includes('lucrative') || message.includes('revenue')) {
    if (message.includes('usa') || message.includes('america')) {
      return generateProfitResponse('USA');
    }
    if (message.includes('canada') || message.includes('canadian')) {
      return generateProfitResponse('Canada');
    }
    if (message.includes('australia') || message.includes('australian')) {
      return generateProfitResponse('Australia');
    }
    return getLanguageResponse(language, 'profit');
  }
  
  if (message.includes('tariff') || message.includes('exporting')) {
    if (message.includes('tea') && message.includes('india') && message.includes('usa')) {
      return `Based on current trade data, the tariff for exporting tea from India to the USA is as follows:

**HS Code**: 0902.30
**Base Tariff**: 6.4%
**Additional Duties**: None
**Total Rate**: 6.4%

The USA is one of the largest importers of Indian tea, with annual imports valued at approximately $250 million. The tariff rate is relatively low due to favorable trade relations between the two countries.

Would you like more detailed information about market access requirements or documentation needed for tea exports?`;
    }

    if (message.includes('silk') && message.includes('india') && message.includes('germany')) {
      return `Exporting silk from India to Germany has a **LOW TO MODERATE** risk profile:

**Risk Analysis:**
• **Political Risk**: Low (Stable EU relations)
• **Tariff Risk**: Low (EU standardized tariffs)
• **Market Risk**: Moderate (Competition from China)
• **Compliance Risk**: Low (Clear EU regulations)

**Current Tariff**: 0% (under EU-India trade preferences)

**Recommendations:**
• Ensure proper labeling and certification
• Consider organic certification for premium pricing
• Monitor competition from Chinese silk producers

Would you like me to provide more detailed market analysis?`;
    }
  }

  if (message.includes('generate') && (message.includes('invoice') || message.includes('document'))) {
    return `I can help you generate trade documents! Based on your request, I can assist with:

**Available Documents:**
• Commercial Invoice
• Proforma Invoice
• Bill of Lading
• Certificate of Origin
• Export Packing List
• Sales Contract

To generate a document, I'll need some information:
1. Document type
2. Product details
3. Origin and destination countries
4. Value and quantity
5. Payment terms

Which document would you like to generate, and can you provide these details?`;
  }

  if (message.includes('risk') && message.includes('exporting')) {
    if (message.includes('brazil') && message.includes('food')) {
      return `Risk analysis for exporting food products to Brazil:

**Overall Risk Level: HIGH (72%)**

**Risk Factors:**
• **Political Risk**: 75% (Economic volatility)
• **Tariff Risk**: 68% (High import duties)
• **Market Risk**: 70% (Strong local competition)
• **Compliance Risk**: 75% (Complex regulations)

**Key Challenges:**
• High import tariffs on processed foods (14.2% average)
• Complex ANVISA food safety requirements
• Currency volatility affecting profit margins
• Strong local competition in staple foods

**Opportunities:**
• Growing middle class demanding premium products
• Increasing health consciousness among consumers
• E-commerce expansion in food retail

Would you like specific recommendations for mitigating these risks?`;
    }
  }

  if (message.includes('partner') || message.includes('matching')) {
    return `I can help you find trade partners! To provide the best matches, I need to know:

**Required Information:**
• Industry/sector
• Target country/region
• Partner type (manufacturer, distributor, retailer, etc.)
• Product specifications
• Order volume requirements
• Quality certifications needed

**Available Filters:**
• Industry expertise
• Geographic location
• Language capabilities
• Certifications and compliance
• Company size and experience
• Ratings and reviews

Once you provide these details, I can search our database of verified partners and provide compatibility scores for each match.

What type of partner are you looking for and in which market?`;
  }

  // Default response with language support
  return getLanguageResponse(language, 'general');
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await db.chatHistory.findMany({
      where: { userId: decodedToken.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        content: true,
        language: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      messages,
      total: await db.chatHistory.count({
        where: { userId: decodedToken.userId }
      })
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}