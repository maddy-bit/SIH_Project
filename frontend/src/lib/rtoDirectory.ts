export interface RtoAreaInfo {
  code: string;
  state: string;
  city: string;
  center: [number, number]; // [lng, lat] for MapLibre
  zoom: number;
  camIdPrefixes: string[];
}

export const RTO_DIRECTORY: Record<string, RtoAreaInfo> = {
  "AN01": {
    "code": "AN-01",
    "state": "Andaman & Nicobar Islands",
    "city": "Port Blair",
    "center": [
      92.7265,
      11.6234
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AN01-"
    ]
  },
  "AP02": {
    "code": "AP-02",
    "state": "Andhra Pradesh",
    "city": "Anantapur",
    "center": [
      77.6006,
      14.6819
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AP02-"
    ]
  },
  "AP07": {
    "code": "AP-07",
    "state": "Andhra Pradesh",
    "city": "Guntur",
    "center": [
      80.4365,
      16.3067
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AP07-"
    ]
  },
  "AP16": {
    "code": "AP-16",
    "state": "Andhra Pradesh",
    "city": "Vijayawada",
    "center": [
      80.648,
      16.5062
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AP16-"
    ]
  },
  "AP31": {
    "code": "AP-31",
    "state": "Andhra Pradesh",
    "city": "Visakhapatnam",
    "center": [
      83.2185,
      17.6868
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AP31-"
    ]
  },
  "AP39": {
    "code": "AP-39",
    "state": "Andhra Pradesh",
    "city": "Tirupati",
    "center": [
      79.4192,
      13.6288
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AP39-"
    ]
  },
  "AR01": {
    "code": "AR-01",
    "state": "Arunachal Pradesh",
    "city": "Itanagar",
    "center": [
      93.6053,
      27.0844
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AR01-"
    ]
  },
  "AR03": {
    "code": "AR-03",
    "state": "Arunachal Pradesh",
    "city": "Tawang",
    "center": [
      91.8594,
      27.5861
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AR03-"
    ]
  },
  "AR09": {
    "code": "AR-09",
    "state": "Arunachal Pradesh",
    "city": "Pasighat",
    "center": [
      95.3267,
      28.0664
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AR09-"
    ]
  },
  "AS01": {
    "code": "AS-01",
    "state": "Assam",
    "city": "Guwahati",
    "center": [
      91.7362,
      26.1445
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AS01-"
    ]
  },
  "AS02": {
    "code": "AS-02",
    "state": "Assam",
    "city": "Nagaon",
    "center": [
      92.684,
      26.3468
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AS02-"
    ]
  },
  "AS03": {
    "code": "AS-03",
    "state": "Assam",
    "city": "Jorhat",
    "center": [
      94.2037,
      26.7509
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AS03-"
    ]
  },
  "AS06": {
    "code": "AS-06",
    "state": "Assam",
    "city": "Dibrugarh",
    "center": [
      94.912,
      27.4728
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AS06-"
    ]
  },
  "AS11": {
    "code": "AS-11",
    "state": "Assam",
    "city": "Silchar",
    "center": [
      92.7789,
      24.8333
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-AS11-"
    ]
  },
  "BR01": {
    "code": "BR-01",
    "state": "Bihar",
    "city": "Patna",
    "center": [
      85.1376,
      25.5941
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-BR01-"
    ]
  },
  "BR02": {
    "code": "BR-02",
    "state": "Bihar",
    "city": "Gaya",
    "center": [
      85.0002,
      24.7914
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-BR02-"
    ]
  },
  "BR06": {
    "code": "BR-06",
    "state": "Bihar",
    "city": "Muzaffarpur",
    "center": [
      85.3647,
      26.1209
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-BR06-"
    ]
  },
  "BR10": {
    "code": "BR-10",
    "state": "Bihar",
    "city": "Bhagalpur",
    "center": [
      86.9842,
      25.2425
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-BR10-"
    ]
  },
  "BR31": {
    "code": "BR-31",
    "state": "Bihar",
    "city": "Bodh Gaya",
    "center": [
      84.987,
      24.6961
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-BR31-"
    ]
  },
  "CH01": {
    "code": "CH-01",
    "state": "Chandigarh",
    "city": "Chandigarh",
    "center": [
      76.7794,
      30.7333
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-CH01-"
    ]
  },
  "CG04": {
    "code": "CG-04",
    "state": "Chhattisgarh",
    "city": "Raipur",
    "center": [
      81.6296,
      21.2514
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-CG04-"
    ]
  },
  "CG07": {
    "code": "CG-07",
    "state": "Chhattisgarh",
    "city": "Durg",
    "center": [
      81.2849,
      21.1904
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-CG07-"
    ]
  },
  "CG10": {
    "code": "CG-10",
    "state": "Chhattisgarh",
    "city": "Bilaspur",
    "center": [
      82.1409,
      22.0797
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-CG10-"
    ]
  },
  "CG15": {
    "code": "CG-15",
    "state": "Chhattisgarh",
    "city": "Ambikapur",
    "center": [
      83.1963,
      23.1189
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-CG15-"
    ]
  },
  "DD01": {
    "code": "DD-01",
    "state": "Dadra & Nagar Haveli and Daman & Diu",
    "city": "Daman",
    "center": [
      72.8328,
      20.3974
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DD01-"
    ]
  },
  "DN09": {
    "code": "DN-09",
    "state": "Dadra & Nagar Haveli and Daman & Diu",
    "city": "Silvassa",
    "center": [
      73.0083,
      20.2763
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DN09-"
    ]
  },
  "DD03": {
    "code": "DD-03",
    "state": "Dadra & Nagar Haveli and Daman & Diu",
    "city": "Diu",
    "center": [
      70.9874,
      20.7144
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DD03-"
    ]
  },
  "DL01": {
    "code": "DL-01",
    "state": "Delhi",
    "city": "Mall Road / North Delhi",
    "center": [
      77.212,
      28.698
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL01-"
    ]
  },
  "DL02": {
    "code": "DL-02",
    "state": "Delhi",
    "city": "New Delhi",
    "center": [
      77.209,
      28.6139
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL02-"
    ]
  },
  "DL03": {
    "code": "DL-03",
    "state": "Delhi",
    "city": "South Delhi",
    "center": [
      77.21,
      28.55
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL03-"
    ]
  },
  "DL04": {
    "code": "DL-04",
    "state": "Delhi",
    "city": "West Delhi",
    "center": [
      77.12,
      28.65
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL04-"
    ]
  },
  "DL05": {
    "code": "DL-05",
    "state": "Delhi",
    "city": "North-East Delhi",
    "center": [
      77.27,
      28.7
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL05-"
    ]
  },
  "DL06": {
    "code": "DL-06",
    "state": "Delhi",
    "city": "Central Delhi",
    "center": [
      77.23,
      28.64
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL06-"
    ]
  },
  "DL07": {
    "code": "DL-07",
    "state": "Delhi",
    "city": "East Delhi",
    "center": [
      77.295,
      28.628
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL07-"
    ]
  },
  "DL08": {
    "code": "DL-08",
    "state": "Delhi",
    "city": "North-West Delhi",
    "center": [
      77.145,
      28.715
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL08-"
    ]
  },
  "DL09": {
    "code": "DL-09",
    "state": "Delhi",
    "city": "South-West Delhi",
    "center": [
      77.06,
      28.58
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL09-"
    ]
  },
  "DL10": {
    "code": "DL-10",
    "state": "Delhi",
    "city": "West Delhi Raja Garden",
    "center": [
      77.1,
      28.64
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL10-"
    ]
  },
  "DL11": {
    "code": "DL-11",
    "state": "Delhi",
    "city": "Rohini",
    "center": [
      77.11,
      28.73
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL11-"
    ]
  },
  "DL12": {
    "code": "DL-12",
    "state": "Delhi",
    "city": "Vasant Vihar",
    "center": [
      77.16,
      28.558
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL12-"
    ]
  },
  "DL13": {
    "code": "DL-13",
    "state": "Delhi",
    "city": "Surajmal Vihar",
    "center": [
      77.31,
      28.655
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-DL13-"
    ]
  },
  "GA01": {
    "code": "GA-01",
    "state": "Goa",
    "city": "Panaji / North Goa",
    "center": [
      73.8278,
      15.4909
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GA01-"
    ]
  },
  "GA02": {
    "code": "GA-02",
    "state": "Goa",
    "city": "Margao / South Goa",
    "center": [
      73.9862,
      15.2832
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GA02-"
    ]
  },
  "GA03": {
    "code": "GA-03",
    "state": "Goa",
    "city": "Mapusa",
    "center": [
      73.8142,
      15.5937
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GA03-"
    ]
  },
  "GA04": {
    "code": "GA-04",
    "state": "Goa",
    "city": "Bicholim",
    "center": [
      73.95,
      15.59
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GA04-"
    ]
  },
  "GJ01": {
    "code": "GJ-01",
    "state": "Gujarat",
    "city": "Ahmedabad",
    "center": [
      72.5714,
      23.0225
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ01-"
    ]
  },
  "GJ03": {
    "code": "GJ-03",
    "state": "Gujarat",
    "city": "Rajkot",
    "center": [
      70.8022,
      22.3039
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ03-"
    ]
  },
  "GJ05": {
    "code": "GJ-05",
    "state": "Gujarat",
    "city": "Surat",
    "center": [
      72.8311,
      21.1702
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ05-"
    ]
  },
  "GJ06": {
    "code": "GJ-06",
    "state": "Gujarat",
    "city": "Vadodara",
    "center": [
      73.1812,
      22.3072
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ06-"
    ]
  },
  "GJ18": {
    "code": "GJ-18",
    "state": "Gujarat",
    "city": "Gandhinagar",
    "center": [
      72.6369,
      23.2156
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ18-"
    ]
  },
  "GJ27": {
    "code": "GJ-27",
    "state": "Gujarat",
    "city": "Ahmedabad East",
    "center": [
      72.61,
      23.012
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-GJ27-"
    ]
  },
  "HR12": {
    "code": "HR-12",
    "state": "Haryana",
    "city": "Rohtak",
    "center": [
      76.6066,
      28.8955
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR12-"
    ]
  },
  "HR13": {
    "code": "HR-13",
    "state": "Haryana",
    "city": "Hisar",
    "center": [
      75.7217,
      29.1492
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR13-"
    ]
  },
  "HR26": {
    "code": "HR-26",
    "state": "Haryana",
    "city": "Gurugram",
    "center": [
      77.0266,
      28.4595
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR26-"
    ]
  },
  "HR29": {
    "code": "HR-29",
    "state": "Haryana",
    "city": "Faridabad",
    "center": [
      77.3178,
      28.4089
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR29-"
    ]
  },
  "HR51": {
    "code": "HR-51",
    "state": "Haryana",
    "city": "Panipat",
    "center": [
      76.9635,
      29.3909
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR51-"
    ]
  },
  "HR55": {
    "code": "HR-55",
    "state": "Haryana",
    "city": "Jind",
    "center": [
      76.3147,
      29.314
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR55-"
    ]
  },
  "HR98": {
    "code": "HR-98",
    "state": "Haryana",
    "city": "Gurugram Commercial",
    "center": [
      77.08,
      28.49
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HR98-"
    ]
  },
  "HP03": {
    "code": "HP-03",
    "state": "Himachal Pradesh",
    "city": "Shimla",
    "center": [
      77.1734,
      31.1048
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HP03-"
    ]
  },
  "HP12": {
    "code": "HP-12",
    "state": "Himachal Pradesh",
    "city": "Dharamshala",
    "center": [
      76.3234,
      32.219
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HP12-"
    ]
  },
  "HP34": {
    "code": "HP-34",
    "state": "Himachal Pradesh",
    "city": "Solan",
    "center": [
      77.0999,
      30.9084
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HP34-"
    ]
  },
  "HP38": {
    "code": "HP-38",
    "state": "Himachal Pradesh",
    "city": "Kangra",
    "center": [
      76.2691,
      32.0998
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HP38-"
    ]
  },
  "HP52": {
    "code": "HP-52",
    "state": "Himachal Pradesh",
    "city": "Mandi",
    "center": [
      76.932,
      31.7087
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-HP52-"
    ]
  },
  "JK02": {
    "code": "JK-02",
    "state": "Jammu & Kashmir",
    "city": "Jammu",
    "center": [
      74.857,
      32.7266
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JK02-"
    ]
  },
  "JK04": {
    "code": "JK-04",
    "state": "Jammu & Kashmir",
    "city": "Srinagar",
    "center": [
      74.7973,
      34.0837
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JK04-"
    ]
  },
  "JK03": {
    "code": "JK-03",
    "state": "Jammu & Kashmir",
    "city": "Anantnag",
    "center": [
      75.1487,
      33.7311
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JK03-"
    ]
  },
  "JH01": {
    "code": "JH-01",
    "state": "Jharkhand",
    "city": "Ranchi",
    "center": [
      85.3096,
      23.3441
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JH01-"
    ]
  },
  "JH02": {
    "code": "JH-02",
    "state": "Jharkhand",
    "city": "Hazaribagh",
    "center": [
      85.3644,
      23.993
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JH02-"
    ]
  },
  "JH05": {
    "code": "JH-05",
    "state": "Jharkhand",
    "city": "Jamshedpur",
    "center": [
      86.2029,
      22.8046
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JH05-"
    ]
  },
  "JH10": {
    "code": "JH-10",
    "state": "Jharkhand",
    "city": "Dhanbad",
    "center": [
      86.4304,
      23.7957
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JH10-"
    ]
  },
  "JH20": {
    "code": "JH-20",
    "state": "Jharkhand",
    "city": "Dumka",
    "center": [
      87.2483,
      24.2676
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-JH20-"
    ]
  },
  "KA01": {
    "code": "KA-01",
    "state": "Karnataka",
    "city": "Bengaluru Central",
    "center": [
      77.5946,
      12.9716
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KA01-"
    ]
  },
  "KA03": {
    "code": "KA-03",
    "state": "Karnataka",
    "city": "Bengaluru East",
    "center": [
      77.64,
      12.98
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KA03-"
    ]
  },
  "KA05": {
    "code": "KA-05",
    "state": "Karnataka",
    "city": "Bengaluru South",
    "center": [
      77.6235,
      12.9175
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KA05-"
    ]
  },
  "KA51": {
    "code": "KA-51",
    "state": "Karnataka",
    "city": "Bengaluru Electronic City",
    "center": [
      77.663,
      12.845
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KA51-"
    ]
  },
  "KA02": {
    "code": "KA-02",
    "state": "Karnataka",
    "city": "Bengaluru West",
    "center": [
      77.55,
      12.99
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KA02-"
    ]
  },
  "KL01": {
    "code": "KL-01",
    "state": "Kerala",
    "city": "Thiruvananthapuram",
    "center": [
      76.9366,
      8.5241
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KL01-"
    ]
  },
  "KL07": {
    "code": "KL-07",
    "state": "Kerala",
    "city": "Ernakulam / Kochi",
    "center": [
      76.2999,
      9.9816
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KL07-"
    ]
  },
  "KL11": {
    "code": "KL-11",
    "state": "Kerala",
    "city": "Kozhikode",
    "center": [
      75.7804,
      11.2588
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KL11-"
    ]
  },
  "KL14": {
    "code": "KL-14",
    "state": "Kerala",
    "city": "Wayanad",
    "center": [
      76.132,
      11.6854
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KL14-"
    ]
  },
  "KL15": {
    "code": "KL-15",
    "state": "Kerala",
    "city": "State Transport Sector",
    "center": [
      76.95,
      8.49
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-KL15-"
    ]
  },
  "LA01": {
    "code": "LA-01",
    "state": "Ladakh",
    "city": "Leh",
    "center": [
      77.5771,
      34.1526
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-LA01-"
    ]
  },
  "LA02": {
    "code": "LA-02",
    "state": "Ladakh",
    "city": "Kargil",
    "center": [
      76.1349,
      34.5539
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-LA02-"
    ]
  },
  "LD01": {
    "code": "LD-01",
    "state": "Lakshadweep",
    "city": "Kavaratti",
    "center": [
      72.642,
      10.5669
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-LD01-"
    ]
  },
  "MP04": {
    "code": "MP-04",
    "state": "Madhya Pradesh",
    "city": "Bhopal",
    "center": [
      77.4126,
      23.2599
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MP04-"
    ]
  },
  "MP09": {
    "code": "MP-09",
    "state": "Madhya Pradesh",
    "city": "Indore",
    "center": [
      75.8577,
      22.7196
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MP09-"
    ]
  },
  "MP20": {
    "code": "MP-20",
    "state": "Madhya Pradesh",
    "city": "Jabalpur",
    "center": [
      79.9864,
      23.1815
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MP20-"
    ]
  },
  "MP07": {
    "code": "MP-07",
    "state": "Madhya Pradesh",
    "city": "Gwalior",
    "center": [
      78.1828,
      26.2183
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MP07-"
    ]
  },
  "MP13": {
    "code": "MP-13",
    "state": "Madhya Pradesh",
    "city": "Ujjain",
    "center": [
      75.7885,
      23.1765
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MP13-"
    ]
  },
  "MH01": {
    "code": "MH-01",
    "state": "Maharashtra",
    "city": "Mumbai Central",
    "center": [
      72.8205,
      18.969
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH01-"
    ]
  },
  "MH02": {
    "code": "MH-02",
    "state": "Maharashtra",
    "city": "Mumbai West",
    "center": [
      72.847,
      19.119
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH02-"
    ]
  },
  "MH03": {
    "code": "MH-03",
    "state": "Maharashtra",
    "city": "Mumbai East",
    "center": [
      72.8826,
      19.0728
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH03-"
    ]
  },
  "MH04": {
    "code": "MH-04",
    "state": "Maharashtra",
    "city": "Thane",
    "center": [
      72.9781,
      19.2183
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH04-"
    ]
  },
  "MH12": {
    "code": "MH-12",
    "state": "Maharashtra",
    "city": "Pune",
    "center": [
      73.8567,
      18.5204
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH12-"
    ]
  },
  "MH14": {
    "code": "MH-14",
    "state": "Maharashtra",
    "city": "Pimpri-Chinchwad",
    "center": [
      73.7997,
      18.6298
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH14-"
    ]
  },
  "MH15": {
    "code": "MH-15",
    "state": "Maharashtra",
    "city": "Nashik",
    "center": [
      73.7898,
      19.9975
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH15-"
    ]
  },
  "MH31": {
    "code": "MH-31",
    "state": "Maharashtra",
    "city": "Nagpur",
    "center": [
      79.0882,
      21.1458
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MH31-"
    ]
  },
  "MN01": {
    "code": "MN-01",
    "state": "Manipur",
    "city": "Imphal",
    "center": [
      93.9368,
      24.817
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MN01-"
    ]
  },
  "ML05": {
    "code": "ML-05",
    "state": "Meghalaya",
    "city": "Shillong",
    "center": [
      91.8933,
      25.5788
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-ML05-"
    ]
  },
  "MZ01": {
    "code": "MZ-01",
    "state": "Mizoram",
    "city": "Aizawl",
    "center": [
      92.7176,
      23.7271
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-MZ01-"
    ]
  },
  "NL01": {
    "code": "NL-01",
    "state": "Nagaland",
    "city": "Kohima",
    "center": [
      94.1086,
      25.6751
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-NL01-"
    ]
  },
  "NL07": {
    "code": "NL-07",
    "state": "Nagaland",
    "city": "Dimapur",
    "center": [
      93.727,
      25.9068
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-NL07-"
    ]
  },
  "OD02": {
    "code": "OD-02",
    "state": "Odisha",
    "city": "Bhubaneswar",
    "center": [
      85.8245,
      20.2961
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-OD02-"
    ]
  },
  "OD05": {
    "code": "OD-05",
    "state": "Odisha",
    "city": "Cuttack",
    "center": [
      85.8828,
      20.4625
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-OD05-"
    ]
  },
  "OD07": {
    "code": "OD-07",
    "state": "Odisha",
    "city": "Berhampur",
    "center": [
      84.7941,
      19.3149
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-OD07-"
    ]
  },
  "OD14": {
    "code": "OD-14",
    "state": "Odisha",
    "city": "Rourkela",
    "center": [
      84.8536,
      22.2604
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-OD14-"
    ]
  },
  "OD33": {
    "code": "OD-33",
    "state": "Odisha",
    "city": "Sundargarh",
    "center": [
      84.0375,
      22.1197
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-OD33-"
    ]
  },
  "PY01": {
    "code": "PY-01",
    "state": "Puducherry",
    "city": "Puducherry",
    "center": [
      79.8083,
      11.9416
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PY01-"
    ]
  },
  "PY02": {
    "code": "PY-02",
    "state": "Puducherry",
    "city": "Karaikal",
    "center": [
      79.838,
      10.9254
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PY02-"
    ]
  },
  "PY03": {
    "code": "PY-03",
    "state": "Puducherry",
    "city": "Mahe",
    "center": [
      75.5343,
      11.7002
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PY03-"
    ]
  },
  "PY04": {
    "code": "PY-04",
    "state": "Puducherry",
    "city": "Yanam",
    "center": [
      82.2174,
      16.733
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PY04-"
    ]
  },
  "PB02": {
    "code": "PB-02",
    "state": "Punjab",
    "city": "Amritsar",
    "center": [
      74.8723,
      31.634
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB02-"
    ]
  },
  "PB08": {
    "code": "PB-08",
    "state": "Punjab",
    "city": "Amritsar South",
    "center": [
      74.85,
      31.61
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB08-"
    ]
  },
  "PB10": {
    "code": "PB-10",
    "state": "Punjab",
    "city": "Ludhiana",
    "center": [
      75.8573,
      30.901
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB10-"
    ]
  },
  "PB11": {
    "code": "PB-11",
    "state": "Punjab",
    "city": "Patiala",
    "center": [
      76.3869,
      30.3398
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB11-"
    ]
  },
  "PB13": {
    "code": "PB-13",
    "state": "Punjab",
    "city": "Jalandhar",
    "center": [
      75.5762,
      31.326
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB13-"
    ]
  },
  "PB65": {
    "code": "PB-65",
    "state": "Punjab",
    "city": "Mohali",
    "center": [
      76.7179,
      30.7046
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-PB65-"
    ]
  },
  "RJ14": {
    "code": "RJ-14",
    "state": "Rajasthan",
    "city": "Jaipur",
    "center": [
      75.7873,
      26.9124
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-RJ14-"
    ]
  },
  "RJ19": {
    "code": "RJ-19",
    "state": "Rajasthan",
    "city": "Jodhpur",
    "center": [
      73.0243,
      26.2389
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-RJ19-"
    ]
  },
  "RJ27": {
    "code": "RJ-27",
    "state": "Rajasthan",
    "city": "Udaipur",
    "center": [
      73.7125,
      24.5854
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-RJ27-"
    ]
  },
  "RJ45": {
    "code": "RJ-45",
    "state": "Rajasthan",
    "city": "Bikaner",
    "center": [
      73.3119,
      28.0229
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-RJ45-"
    ]
  },
  "RJ20": {
    "code": "RJ-20",
    "state": "Rajasthan",
    "city": "Kota",
    "center": [
      75.8648,
      25.2138
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-RJ20-"
    ]
  },
  "SK01": {
    "code": "SK-01",
    "state": "Sikkim",
    "city": "Gangtok",
    "center": [
      88.6138,
      27.3314
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-SK01-"
    ]
  },
  "TN01": {
    "code": "TN-01",
    "state": "Tamil Nadu",
    "city": "Chennai Central",
    "center": [
      80.2707,
      13.0827
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN01-"
    ]
  },
  "TN02": {
    "code": "TN-02",
    "state": "Tamil Nadu",
    "city": "Chennai North-West",
    "center": [
      80.22,
      13.1
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN02-"
    ]
  },
  "TN09": {
    "code": "TN-09",
    "state": "Tamil Nadu",
    "city": "Chennai West",
    "center": [
      80.2,
      13.04
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN09-"
    ]
  },
  "TN10": {
    "code": "TN-10",
    "state": "Tamil Nadu",
    "city": "Chennai South-West",
    "center": [
      80.21,
      12.98
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN10-"
    ]
  },
  "TN22": {
    "code": "TN-22",
    "state": "Tamil Nadu",
    "city": "Meenambakkam / Chennai",
    "center": [
      80.165,
      12.988
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN22-"
    ]
  },
  "TN37": {
    "code": "TN-37",
    "state": "Tamil Nadu",
    "city": "Coimbatore South",
    "center": [
      76.96,
      10.98
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN37-"
    ]
  },
  "TN38": {
    "code": "TN-38",
    "state": "Tamil Nadu",
    "city": "Coimbatore North",
    "center": [
      76.96,
      11.02
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TN38-"
    ]
  },
  "TS09": {
    "code": "TS-09",
    "state": "Telangana",
    "city": "Hyderabad Central",
    "center": [
      78.4867,
      17.385
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TS09-"
    ]
  },
  "TS10": {
    "code": "TS-10",
    "state": "Telangana",
    "city": "Hyderabad North",
    "center": [
      78.49,
      17.44
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TS10-"
    ]
  },
  "TS11": {
    "code": "TS-11",
    "state": "Telangana",
    "city": "Hyderabad East",
    "center": [
      78.55,
      17.37
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TS11-"
    ]
  },
  "TS12": {
    "code": "TS-12",
    "state": "Telangana",
    "city": "Hyderabad South",
    "center": [
      78.47,
      17.32
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TS12-"
    ]
  },
  "TS13": {
    "code": "TS-13",
    "state": "Telangana",
    "city": "Hyderabad West",
    "center": [
      78.39,
      17.43
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TS13-"
    ]
  },
  "TG07": {
    "code": "TG-07",
    "state": "Telangana",
    "city": "Ranga Reddy",
    "center": [
      78.349,
      17.44
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TG07-"
    ]
  },
  "TR01": {
    "code": "TR-01",
    "state": "Tripura",
    "city": "Agartala",
    "center": [
      91.2868,
      23.8315
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-TR01-"
    ]
  },
  "UP11": {
    "code": "UP-11",
    "state": "Uttar Pradesh",
    "city": "Saharanpur",
    "center": [
      77.546,
      29.964
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP11-"
    ]
  },
  "UP12": {
    "code": "UP-12",
    "state": "Uttar Pradesh",
    "city": "Muzaffarnagar",
    "center": [
      77.7085,
      29.4727
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP12-"
    ]
  },
  "UP13": {
    "code": "UP-13",
    "state": "Uttar Pradesh",
    "city": "Bulandshahr",
    "center": [
      77.8498,
      28.4069
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP13-"
    ]
  },
  "UP14": {
    "code": "UP-14",
    "state": "Uttar Pradesh",
    "city": "Ghaziabad",
    "center": [
      77.4538,
      28.6692
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP14-",
      "CAM-0",
      "CAM-1"
    ]
  },
  "UP15": {
    "code": "UP-15",
    "state": "Uttar Pradesh",
    "city": "Meerut",
    "center": [
      77.7064,
      28.9845
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP15-"
    ]
  },
  "UP16": {
    "code": "UP-16",
    "state": "Uttar Pradesh",
    "city": "Gautam Buddha Nagar / Noida",
    "center": [
      77.391,
      28.5355
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP16-"
    ]
  },
  "UP17": {
    "code": "UP-17",
    "state": "Uttar Pradesh",
    "city": "Baghpat",
    "center": [
      77.2215,
      28.9457
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP17-"
    ]
  },
  "UP19": {
    "code": "UP-19",
    "state": "Uttar Pradesh",
    "city": "Shamli",
    "center": [
      77.3117,
      29.4485
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP19-"
    ]
  },
  "UP20": {
    "code": "UP-20",
    "state": "Uttar Pradesh",
    "city": "Bijnor",
    "center": [
      78.1352,
      29.3732
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP20-"
    ]
  },
  "UP21": {
    "code": "UP-21",
    "state": "Uttar Pradesh",
    "city": "Moradabad",
    "center": [
      78.7733,
      28.8386
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP21-"
    ]
  },
  "UP22": {
    "code": "UP-22",
    "state": "Uttar Pradesh",
    "city": "Rampur",
    "center": [
      79.0256,
      28.8154
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP22-"
    ]
  },
  "UP23": {
    "code": "UP-23",
    "state": "Uttar Pradesh",
    "city": "Amroha",
    "center": [
      78.4682,
      28.9044
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP23-"
    ]
  },
  "UP24": {
    "code": "UP-24",
    "state": "Uttar Pradesh",
    "city": "Budaun",
    "center": [
      79.1248,
      28.0315
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP24-"
    ]
  },
  "UP25": {
    "code": "UP-25",
    "state": "Uttar Pradesh",
    "city": "Bareilly",
    "center": [
      79.4304,
      28.367
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP25-"
    ]
  },
  "UP26": {
    "code": "UP-26",
    "state": "Uttar Pradesh",
    "city": "Pilibhit",
    "center": [
      79.8037,
      28.6315
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP26-"
    ]
  },
  "UP27": {
    "code": "UP-27",
    "state": "Uttar Pradesh",
    "city": "Shahjahanpur",
    "center": [
      79.912,
      27.8804
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP27-"
    ]
  },
  "UP30": {
    "code": "UP-30",
    "state": "Uttar Pradesh",
    "city": "Hardoi",
    "center": [
      80.1314,
      27.3953
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP30-"
    ]
  },
  "UP31": {
    "code": "UP-31",
    "state": "Uttar Pradesh",
    "city": "Lakhimpur Kheri",
    "center": [
      80.7787,
      27.9463
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP31-"
    ]
  },
  "UP32": {
    "code": "UP-32",
    "state": "Uttar Pradesh",
    "city": "Lucknow",
    "center": [
      80.9462,
      26.8467
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP32-"
    ]
  },
  "UP32A": {
    "code": "UP-32A",
    "state": "Uttar Pradesh",
    "city": "Trans Gomti, Lucknow",
    "center": [
      80.98,
      26.87
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP32A-"
    ]
  },
  "UP33": {
    "code": "UP-33",
    "state": "Uttar Pradesh",
    "city": "Rae Bareli",
    "center": [
      81.2409,
      26.2303
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP33-"
    ]
  },
  "UP34": {
    "code": "UP-34",
    "state": "Uttar Pradesh",
    "city": "Sitapur",
    "center": [
      80.6829,
      27.5645
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP34-"
    ]
  },
  "UP35": {
    "code": "UP-35",
    "state": "Uttar Pradesh",
    "city": "Unnao",
    "center": [
      80.4878,
      26.5393
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP35-"
    ]
  },
  "UP36": {
    "code": "UP-36",
    "state": "Uttar Pradesh",
    "city": "Amethi",
    "center": [
      81.8152,
      26.1558
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP36-"
    ]
  },
  "UP37": {
    "code": "UP-37",
    "state": "Uttar Pradesh",
    "city": "Hapur",
    "center": [
      77.7759,
      28.7306
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP37-"
    ]
  },
  "UP38": {
    "code": "UP-38",
    "state": "Uttar Pradesh",
    "city": "Sambhal",
    "center": [
      78.5667,
      28.5833
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP38-"
    ]
  },
  "UP40": {
    "code": "UP-40",
    "state": "Uttar Pradesh",
    "city": "Bahraich",
    "center": [
      81.5947,
      27.575
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP40-"
    ]
  },
  "UP41": {
    "code": "UP-41",
    "state": "Uttar Pradesh",
    "city": "Barabanki",
    "center": [
      81.1843,
      26.9276
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP41-"
    ]
  },
  "UP42": {
    "code": "UP-42",
    "state": "Uttar Pradesh",
    "city": "Ayodhya",
    "center": [
      82.1998,
      26.7922
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP42-"
    ]
  },
  "UP43": {
    "code": "UP-43",
    "state": "Uttar Pradesh",
    "city": "Gonda",
    "center": [
      81.9619,
      27.1337
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP43-"
    ]
  },
  "UP44": {
    "code": "UP-44",
    "state": "Uttar Pradesh",
    "city": "Sultanpur",
    "center": [
      82.0727,
      26.2648
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP44-"
    ]
  },
  "UP45": {
    "code": "UP-45",
    "state": "Uttar Pradesh",
    "city": "Ambedkar Nagar",
    "center": [
      82.6848,
      26.4448
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP45-"
    ]
  },
  "UP46": {
    "code": "UP-46",
    "state": "Uttar Pradesh",
    "city": "Shravasti",
    "center": [
      81.9169,
      27.7011
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP46-"
    ]
  },
  "UP47": {
    "code": "UP-47",
    "state": "Uttar Pradesh",
    "city": "Balrampur",
    "center": [
      82.1856,
      27.4292
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP47-"
    ]
  },
  "UP50": {
    "code": "UP-50",
    "state": "Uttar Pradesh",
    "city": "Azamgarh",
    "center": [
      83.1837,
      26.0689
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP50-"
    ]
  },
  "UP51": {
    "code": "UP-51",
    "state": "Uttar Pradesh",
    "city": "Basti",
    "center": [
      82.763,
      26.7994
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP51-"
    ]
  },
  "UP52": {
    "code": "UP-52",
    "state": "Uttar Pradesh",
    "city": "Deoria",
    "center": [
      83.7791,
      26.5024
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP52-"
    ]
  },
  "UP53": {
    "code": "UP-53",
    "state": "Uttar Pradesh",
    "city": "Gorakhpur",
    "center": [
      83.3732,
      26.7606
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP53-"
    ]
  },
  "UP54": {
    "code": "UP-54",
    "state": "Uttar Pradesh",
    "city": "Mau",
    "center": [
      83.5611,
      25.9417
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP54-"
    ]
  },
  "UP55": {
    "code": "UP-55",
    "state": "Uttar Pradesh",
    "city": "Siddharthnagar",
    "center": [
      82.809,
      27.2917
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP55-"
    ]
  },
  "UP56": {
    "code": "UP-56",
    "state": "Uttar Pradesh",
    "city": "Maharajganj",
    "center": [
      83.5606,
      27.1458
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP56-"
    ]
  },
  "UP57": {
    "code": "UP-57",
    "state": "Uttar Pradesh",
    "city": "Padrauna / Kushinagar",
    "center": [
      83.9818,
      26.9019
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP57-"
    ]
  },
  "UP58": {
    "code": "UP-58",
    "state": "Uttar Pradesh",
    "city": "Sant Kabir Nagar",
    "center": [
      83.0249,
      26.7869
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP58-"
    ]
  },
  "UP60": {
    "code": "UP-60",
    "state": "Uttar Pradesh",
    "city": "Ballia",
    "center": [
      84.1497,
      25.7594
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP60-"
    ]
  },
  "UP61": {
    "code": "UP-61",
    "state": "Uttar Pradesh",
    "city": "Ghazipur",
    "center": [
      83.577,
      25.5866
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP61-"
    ]
  },
  "UP62": {
    "code": "UP-62",
    "state": "Uttar Pradesh",
    "city": "Jaunpur",
    "center": [
      82.6837,
      25.7464
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP62-"
    ]
  },
  "UP63": {
    "code": "UP-63",
    "state": "Uttar Pradesh",
    "city": "Mirzapur",
    "center": [
      82.5644,
      25.1337
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP63-"
    ]
  },
  "UP64": {
    "code": "UP-64",
    "state": "Uttar Pradesh",
    "city": "Sonbhadra",
    "center": [
      83.0645,
      24.6854
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP64-"
    ]
  },
  "UP65": {
    "code": "UP-65",
    "state": "Uttar Pradesh",
    "city": "Varanasi",
    "center": [
      82.9739,
      25.3176
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP65-"
    ]
  },
  "UP65A": {
    "code": "UP-65A",
    "state": "Uttar Pradesh",
    "city": "Varanasi Outer",
    "center": [
      83.01,
      25.34
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP65A-"
    ]
  },
  "UP66": {
    "code": "UP-66",
    "state": "Uttar Pradesh",
    "city": "Bhadohi",
    "center": [
      82.5707,
      25.3944
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP66-"
    ]
  },
  "UP67": {
    "code": "UP-67",
    "state": "Uttar Pradesh",
    "city": "Chandauli",
    "center": [
      83.2661,
      25.2612
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP67-"
    ]
  },
  "UP70": {
    "code": "UP-70",
    "state": "Uttar Pradesh",
    "city": "Prayagraj",
    "center": [
      81.8463,
      25.4358
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP70-"
    ]
  },
  "UP71": {
    "code": "UP-71",
    "state": "Uttar Pradesh",
    "city": "Fatehpur",
    "center": [
      80.8129,
      25.9272
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP71-"
    ]
  },
  "UP72": {
    "code": "UP-72",
    "state": "Uttar Pradesh",
    "city": "Pratapgarh",
    "center": [
      81.9448,
      25.8966
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP72-"
    ]
  },
  "UP73": {
    "code": "UP-73",
    "state": "Uttar Pradesh",
    "city": "Kaushambi",
    "center": [
      81.4011,
      25.5342
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP73-"
    ]
  },
  "UP74": {
    "code": "UP-74",
    "state": "Uttar Pradesh",
    "city": "Kannauj",
    "center": [
      79.9199,
      27.0544
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP74-"
    ]
  },
  "UP75": {
    "code": "UP-75",
    "state": "Uttar Pradesh",
    "city": "Etawah",
    "center": [
      79.0154,
      26.7855
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP75-"
    ]
  },
  "UP76": {
    "code": "UP-76",
    "state": "Uttar Pradesh",
    "city": "Farrukhabad",
    "center": [
      79.5847,
      27.3826
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP76-"
    ]
  },
  "UP77": {
    "code": "UP-77",
    "state": "Uttar Pradesh",
    "city": "Kanpur Dehat",
    "center": [
      79.9547,
      26.4385
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP77-"
    ]
  },
  "UP78": {
    "code": "UP-78",
    "state": "Uttar Pradesh",
    "city": "Kanpur Nagar",
    "center": [
      80.3319,
      26.4499
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP78-"
    ]
  },
  "UP79": {
    "code": "UP-79",
    "state": "Uttar Pradesh",
    "city": "Auraiya",
    "center": [
      79.5165,
      26.4673
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP79-"
    ]
  },
  "UP80": {
    "code": "UP-80",
    "state": "Uttar Pradesh",
    "city": "Agra",
    "center": [
      78.0081,
      27.1767
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP80-"
    ]
  },
  "UP81": {
    "code": "UP-81",
    "state": "Uttar Pradesh",
    "city": "Aligarh",
    "center": [
      78.088,
      27.8974
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP81-"
    ]
  },
  "UP82": {
    "code": "UP-82",
    "state": "Uttar Pradesh",
    "city": "Etah",
    "center": [
      78.6631,
      27.5583
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP82-"
    ]
  },
  "UP83": {
    "code": "UP-83",
    "state": "Uttar Pradesh",
    "city": "Firozabad",
    "center": [
      78.3957,
      27.1593
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP83-"
    ]
  },
  "UP84": {
    "code": "UP-84",
    "state": "Uttar Pradesh",
    "city": "Mainpuri",
    "center": [
      79.0287,
      27.2289
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP84-"
    ]
  },
  "UP85": {
    "code": "UP-85",
    "state": "Uttar Pradesh",
    "city": "Mathura",
    "center": [
      77.6737,
      27.4924
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP85-"
    ]
  },
  "UP86": {
    "code": "UP-86",
    "state": "Uttar Pradesh",
    "city": "Hathras",
    "center": [
      78.0519,
      27.5969
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP86-"
    ]
  },
  "UP87": {
    "code": "UP-87",
    "state": "Uttar Pradesh",
    "city": "Kasganj",
    "center": [
      78.6469,
      27.808
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP87-"
    ]
  },
  "UP90": {
    "code": "UP-90",
    "state": "Uttar Pradesh",
    "city": "Banda",
    "center": [
      80.3347,
      25.4756
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP90-"
    ]
  },
  "UP91": {
    "code": "UP-91",
    "state": "Uttar Pradesh",
    "city": "Hamirpur",
    "center": [
      80.1506,
      25.9554
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP91-"
    ]
  },
  "UP92": {
    "code": "UP-92",
    "state": "Uttar Pradesh",
    "city": "Jalaun",
    "center": [
      79.3519,
      26.1444
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP92-"
    ]
  },
  "UP93": {
    "code": "UP-93",
    "state": "Uttar Pradesh",
    "city": "Jhansi",
    "center": [
      78.5685,
      25.4484
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP93-"
    ]
  },
  "UP94": {
    "code": "UP-94",
    "state": "Uttar Pradesh",
    "city": "Lalitpur",
    "center": [
      78.4116,
      24.6896
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP94-"
    ]
  },
  "UP95": {
    "code": "UP-95",
    "state": "Uttar Pradesh",
    "city": "Mahoba",
    "center": [
      79.8722,
      25.2926
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP95-"
    ]
  },
  "UP96": {
    "code": "UP-96",
    "state": "Uttar Pradesh",
    "city": "Chitrakoot",
    "center": [
      80.8653,
      25.1763
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UP96-"
    ]
  },
  "UK01": {
    "code": "UK-01",
    "state": "Uttarakhand",
    "city": "Almora",
    "center": [
      79.6591,
      29.5971
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UK01-"
    ]
  },
  "UK04": {
    "code": "UK-04",
    "state": "Uttarakhand",
    "city": "Nainital / Haldwani",
    "center": [
      79.513,
      29.2183
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UK04-"
    ]
  },
  "UK07": {
    "code": "UK-07",
    "state": "Uttarakhand",
    "city": "Dehradun",
    "center": [
      78.0322,
      30.3165
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UK07-"
    ]
  },
  "UK08": {
    "code": "UK-08",
    "state": "Uttarakhand",
    "city": "Haridwar",
    "center": [
      78.1642,
      29.9457
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UK08-"
    ]
  },
  "UK12": {
    "code": "UK-12",
    "state": "Uttarakhand",
    "city": "Pauri Garhwal",
    "center": [
      78.7808,
      30.1477
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-UK12-"
    ]
  },
  "WB01": {
    "code": "WB-01",
    "state": "West Bengal",
    "city": "Kolkata Central",
    "center": [
      88.3639,
      22.5726
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-WB01-"
    ]
  },
  "WB02": {
    "code": "WB-02",
    "state": "West Bengal",
    "city": "Kolkata North",
    "center": [
      88.38,
      22.648
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-WB02-"
    ]
  },
  "WB06": {
    "code": "WB-06",
    "state": "West Bengal",
    "city": "Howrah",
    "center": [
      88.2636,
      22.5958
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-WB06-"
    ]
  },
  "WB24": {
    "code": "WB-24",
    "state": "West Bengal",
    "city": "South 24 Parganas",
    "center": [
      88.33,
      22.52
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-WB24-"
    ]
  },
  "WB38": {
    "code": "WB-38",
    "state": "West Bengal",
    "city": "Burdwan",
    "center": [
      87.8615,
      23.2324
    ],
    "zoom": 12.4,
    "camIdPrefixes": [
      "CAM-WB38-"
    ]
  }
};

/** Whole India panoramic overview coordinates */
export const WHOLE_INDIA_CENTER: [number, number] = [78.9629, 21.5];
export const WHOLE_INDIA_ZOOM = 4.4;

/**
 * Parses raw plate string to find matching RTO Area
 */
export function resolveRtoArea(plate: string): RtoAreaInfo | null {
  if (!plate) return null;
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 2) return null;

  // 1. Direct 4-char match (e.g. UP14, UP32, BR01, MH12, KA51, RJ14)
  if (clean.length >= 4) {
    const code4 = clean.substring(0, 4);
    if (RTO_DIRECTORY[code4]) return RTO_DIRECTORY[code4];
  }

  // 2. Direct 2-char match (e.g. DL, CH, etc.)
  const code2 = clean.substring(0, 2);
  if (RTO_DIRECTORY[code2]) return RTO_DIRECTORY[code2];

  // 3. Match 3-char if any like UP32A
  if (clean.length >= 5) {
    const code5 = clean.substring(0, 5);
    if (RTO_DIRECTORY[code5]) return RTO_DIRECTORY[code5];
  }

  // 4. Fallback matching for state prefix if specific RTO not individually mapped
  for (const [key, info] of Object.entries(RTO_DIRECTORY)) {
    if (key.startsWith(code2)) {
      return info;
    }
  }

  return null;
}
