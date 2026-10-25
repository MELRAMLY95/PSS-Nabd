export const BOARDS = {
  lungs: {
    organ: "The lungs",
    subtitle: "Breathing cleaner air in Oman 2040",
    simTitle: "Test and measure",
    key: "Healthy lungs need clean air. A sustainable city must protect the air its people breathe.",
    sections: [
      {
        n: "1",
        title: "Biological function",
        text: "The respiratory system exchanges oxygen and carbon dioxide between the air and the blood. Air passes the nose and mouth, the pharynx, the larynx and the trachea, then the bronchi, and reaches the alveoli. Breathing is how the body takes in fresh air. In a city, cleaner air is the same need: air that can be breathed.",
        points: ["Nose and mouth", "Pharynx and larynx", "Trachea", "Bronchi", "Alveoli"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Fine particles and some gases can harm health. Dust and sand are common, and they are not all caused by people. Other pollution still has to be managed. Knowing which source is which matters.",
        points: ["Vehicle emissions", "Industrial emissions", "Construction dust", "Dust and sand storms, which also occur naturally"],
      },
      {
        n: "3",
        title: "The sustainable solution",
        points: ["Public transport", "Cleaner vehicles", "Industrial emission controls", "Walking and cycling routes", "Urban tree planting", "Construction dust management", "Air-quality monitoring"],
      },
      {
        n: "4",
        title: "Our working prototype",
        text: "A transparent airflow channel holds a filter. Air enters at the inlet and leaves at the outlet. A paper ribbon shows the direction of the flow. A small low-voltage fan is optional.",
        points: ["Inlet", "Filter material", "Transparent airflow channel", "Outlet", "Paper ribbon for airflow direction", "Low-voltage fan, optional"],
      },
      {
        n: "5",
        title: "How the demonstration works",
        text: "Air is drawn through the filter. The paper ribbon moves when air moves. This shows airflow. It does not measure how much pollution was removed, and it does not show that every gas was caught.",
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Clear recycled plastic for the channel", "Filter material", "Cardboard and foam board for the building", "Paper ribbon", "Small fan, optional", "Support frame", "Tape and glue"],
      },
    ],
  },
  skeleton: {
    organ: "The skeleton",
    subtitle: "Building the framework of Oman 2040",
    simTitle: "Test and measure",
    key: "The skeleton supports the body. Reliable infrastructure supports every part of a sustainable city.",
    sections: [
      {
        n: "1",
        title: "Biological function",
        text: "The skeleton supports the body and protects internal organs. With muscles, it makes movement possible. Bone marrow helps produce blood cells. A city's frame is only an analogy: it connects communities. It is not a spine.",
        points: ["Skull", "Vertebral column", "Rib cage", "Pelvis", "Limb bones"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Cities need reliable roads, safe walking routes, water, electricity, drainage, and buildings suited to local heat and water. Poor coordination can waste land, lengthen trips, and leave an essential service without a path.",
      },
      {
        n: "3",
        title: "The sustainable solution",
        points: ["Compact urban planning", "Shaded walkways", "Safe cycling routes", "Reliable public transport", "Efficient water networks", "Organised underground utility routing", "Durable construction", "Infrastructure designed for local heat and water"],
      },
      {
        n: "4",
        title: "Our working prototype",
        text: "A strong rectangular base carries roads, building footprints, water tubing and concealed wiring. An access panel keeps the electronics reachable for repair. A miniature water path sits in the city. Costs on the screen are model units, not a tender.",
        points: ["Foam-board and thick recycled cardboard base", "Roads and pathways", "Water tubing", "Low-voltage wiring in the base", "Access panel"],
      },
      {
        n: "5",
        title: "How the system connects",
        points: ["Energy distribution reaches the districts", "Water supply reaches the irrigation bed", "Sensor connections reach the controller, then the shade and the pump", "Roads and pathways join the buildings"],
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Foam board and thick recycled cardboard", "Craft sticks, ruler, cutting mat, glue and paint", "Thin tubing", "Low-voltage wires", "A flat base that can be measured again"],
      },
    ],
  },
  kidneys: {
    organ: "The kidney",
    subtitle: "Water conservation and smart irrigation",
    simTitle: "Test and measure",
    key: "Healthy kidneys filter waste and conserve water. A city has to keep water in use without treating every litre as drinking water.",
    sections: [
      {
        n: "1",
        title: "The biological connection",
        text: "The kidneys filter blood, remove metabolic wastes, and help regulate water, electrolytes and fluid balance. Urine leaves through the ureters toward the bladder and the urethra. The nephron is the unit that filters and then takes back what the body still needs. The city model is inspired by that careful use of fluid. It is not a nephron.",
        points: ["Kidney", "Ureter", "Bladder", "Urethra", "Nephron"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "An arid climate and hot summers put pressure on fresh water. Cooling uses both energy and water. Essential services have to be coordinated so water is not spent twice. This board quotes no national water account.",
        points: ["Extreme summer heat", "High energy demand for cooling", "Water scarcity", "Coordinating essential services"],
      },
      {
        n: "3",
        title: "The sustainable solution",
        points: ["Drip irrigation to the roots", "Water only when the soil needs it", "Leak detection in the network", "Efficient distribution", "Collect non-potable water only for uses where it is safe and permitted", "Crops that can tolerate drier conditions"],
        note: "Non-potable water must never be used for drinking in this demonstration.",
      },
      {
        n: "4",
        title: "Our working prototype",
        points: ["Compact water reservoir", "Thin transparent tubing", "Temperature sensor", "Soil-moisture sensor", "Miniature growing bed", "Low-voltage pump and tubing"],
      },
      {
        n: "5",
        title: "How the system works",
        text: "The moisture sensor and the temperature sensor are read by the controller. The controller is the decision point. It can start the pump so water reaches the plants. On this page the controller is simulated. It does not switch the physical pump.",
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Arduino-compatible board", "Temperature sensor", "Soil-moisture sensor", "Small servo, where a shade is fitted", "Low-voltage pump", "Clear recycled container for the reservoir", "Filter material", "Cardboard and foam board", "Paper ribbon", "Tape and glue"],
        note: "The pump is a load. It is not connected as if it were a controller pin.",
      },
    ],
  },
  digestive: {
    organ: "The digestive system",
    subtitle: "Growing food for Oman 2040",
    simTitle: "Test and measure",
    key: "A healthy body needs nutritious food. A sustainable city needs resilient ways to grow it and to deliver it.",
    sections: [
      {
        n: "1",
        title: "Biological function",
        text: "The digestive system breaks food down, absorbs nutrients and water, and moves undigested material on. Food is the energy and the building material the body uses. The digestive system does not grow crops.",
        points: ["Mouth", "Oesophagus", "Stomach", "Liver and pancreas", "Small intestine", "Large intestine"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Arid conditions and limited water make local food production difficult. Communities still need reliable access to nutritious food. Imports, supply breaks, food waste and inefficient watering are the pressures named on this board. No national harvest figure is quoted.",
      },
      {
        n: "3",
        title: "The sustainable solution",
        points: ["Drip irrigation and protected growing", "Returning suitable organic waste toward the soil, as a parallel with digestion, not as a claim that the gut makes compost", "A primary surface network and a deeper feed to the roots", "A greenhouse skin that limits heat while using water carefully"],
      },
      {
        n: "4",
        title: "Our working prototype",
        text: "A miniature bed or greenhouse holds seedlings. A small reservoir and irrigation tubing feed the bed. A soil-moisture sensor is the intended control. The bed demonstrates the idea of protected growing. It is not the output of a commercial farm.",
        points: ["Miniature reservoir", "Irrigation tubing", "Growing bed", "Soil-moisture sensor"],
      },
      {
        n: "5",
        title: "How it works",
        text: "Water leaves the reservoir, travels in the tubing, and reaches the growing bed. Seedlings stand for food crops. Record plant height, leaves and water added over several weeks. The log is not a weighed harvest.",
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Shallow reused container", "Growing medium", "Seeds or seedlings", "Irrigation tubing and a small reservoir", "Optional low-voltage pump", "Optional soil-moisture sensor"],
        note: "Use the same seedlings over several weeks if you compare water use. Choose a crop that fits the water, the heat and the salinity.",
      },
    ],
  },
  liver: {
    organ: "The liver",
    subtitle: "Turning waste into resources",
    simTitle: "Test and measure",
    key: "A sustainable city does not only manage waste. It prevents waste and keeps useful materials in use.",
    sections: [
      {
        n: "1",
        title: "Biological function",
        text: "The liver processes nutrients, helps metabolise substances, produces bile and carries out other chemical work. Bile ducts lead toward the gallbladder. The liver processes substances in the body. It does not literally sort household rubbish.",
        points: ["Liver", "Gallbladder", "Major bile ducts"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Waste from households, packaging, food and construction consumes resources and can pollute when it is handled as one pile. Organic waste can often be kept out of general waste, while reusable and recyclable materials should be separated where collection supports them. No official diversion rate is quoted.",
      },
      {
        n: "3",
        title: "The sustainable solution",
        text: "Use the waste hierarchy: prevent waste, then reuse, recycle, and compost suitable organic material. The aim is to keep materials useful for longer. What can be recycled depends on the local collection system.",
        points: ["Prevention and reuse", "Recycling", "Organic material to composting", "General waste only for what remains"],
      },
      {
        n: "4",
        title: "Our working prototype",
        text: "A small pavilion has compartments for recyclable material, organic waste and general waste, with a miniature compost example. A second pavilion can show distribution back into the model city. This is a sorting demonstration, not an operating plant.",
        points: ["Recyclable", "Organic", "General waste", "Miniature compost"],
      },
      {
        n: "5",
        title: "How the demonstration works",
        text: "Sort each sample into the stream it belongs to. A clean bottle is not the same as a food-soiled wrapper. Hazardous items stay out of recovery. The kilogram check on the belt uses stated sample masses, not a city audit.",
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Foam board and recycled cardboard", "Small containers", "Coloured labels", "Paper sample items", "A covered compost container"],
      },
    ],
  },
  skin: {
    organ: "The skin",
    subtitle: "Protecting Oman from extreme heat",
    simTitle: "Test and measure",
    key: "Like skin protects the body, shade outside the building protects people from heat before the heat is indoors.",
    sections: [
      {
        n: "1",
        title: "The biological connection",
        text: "Skin is the body's outer barrier and a part of temperature control. Sweat can carry heat away as it evaporates. Blood flow near the surface also changes heat loss. This is the idea behind putting shade and a reflective skin outside a building, not only cooling the room after the heat has entered.",
        points: ["Epidermis", "Dermis", "Subcutaneous layer", "Sweat gland", "Hair follicle", "Blood vessels"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        points: ["Extreme summer heat", "High solar radiation", "More demand for air conditioning", "Discomfort and health risk when people and buildings overheat"],
        note: "This board states no share of national electricity use and no measured saving.",
      },
      {
        n: "3",
        title: "The sustainable solution",
        points: ["Reflective roofs, in the way pale skin and hair reflect more radiation", "Green walls where water allows them, as a parallel with evaporation", "Smart shading, in the way the body changes its surface", "Sensors that deploy shade instead of only running cooling"],
      },
      {
        n: "4",
        title: "Our working prototype",
        points: ["Miniature shade canopy", "Small servo under the canopy", "Temperature sensor near the window", "Control logic that can move the canopy"],
      },
      {
        n: "5",
        title: "How the automatic shade works",
        text: "The sensor reports heat. The controller compares it with a threshold. The servo changes the canopy angle. On this page that chain is simulated. The indoor figure is a model index, not a thermometer in the cardboard house.",
        points: ["1. Temperature sensor", "2. Controller", "3. Servo moves the shade"],
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Miniature house components", "Temperature-style probe", "Microcontroller", "Servo motor", "Hinged balsa-wood canopy", "Connecting wires", "Battery or USB power", "Foam board base"],
      },
    ],
  },
  brain: {
    organ: "The brain",
    subtitle: "The intelligence behind Oman 2040",
    simTitle: "Test and measure",
    key: "A smart city senses its problems, makes a decision, and responds. People still set the rules.",
    sections: [
      {
        n: "1",
        title: "Biological function",
        text: "The brain receives information, processes it and coordinates a response. The cerebrum does much of the sensing and deciding, the cerebellum helps coordinate movement, and the brainstem supports vital automatic work. A city controller is a far simpler rule than any of those parts.",
        points: ["Cerebrum", "Cerebellum", "Brainstem"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Heat, water scarcity, cooling demand and essential services overlap. Without a shared reading, one system can waste what another needs. No combined national statistic is quoted.",
        points: ["Extreme summer heat", "High energy demand for cooling", "Water scarcity", "Coordinating essential services"],
      },
      {
        n: "3",
        title: "The sustainable solution",
        text: "Sensors and a controller trigger a small set of actions: shade when it is hot, water when the soil is dry. The data only helps if the rule is one you can explain.",
        points: ["Temperature-responsive shading", "Smart irrigation", "Automatic control logic", "Microcontroller", "Sensors"],
      },
      {
        n: "4",
        title: "Our working prototype",
        points: ["Controller concealed in the base", "Temperature sensor", "Soil-moisture sensor", "Servo on the shade canopy", "Low-voltage irrigation pump and tubing"],
      },
      {
        n: "5",
        title: "How our system thinks",
        text: "Temperature goes to the controller, which can move the servo. Soil moisture goes to the controller, which can run the pump when the soil is dry. The controller is the decision point. This website does not send those commands to a physical board.",
      },
      {
        n: "6",
        title: "Materials and build",
        points: ["Arduino-compatible board", "Temperature sensor", "Soil-moisture sensor", "Small servo", "Low-voltage pump", "Transistor or driver for the pump", "Connecting wires", "Low-voltage supply"],
        note: "The pump is a load. Do not wire it as though it were a controller pin.",
      },
    ],
  },
  heart: {
    organ: "The heart",
    subtitle: "How Oman 2040 can circulate clean energy",
    simTitle: "Test and measure",
    key: "The heart keeps the body alive. Clean and reliable energy keeps a sustainable city running.",
    sections: [
      {
        n: "1",
        title: "The biological connection",
        text: "The heart pumps blood through the body. The vena cava returns blood, the right side sends it toward the lungs, and the left side sends oxygenated blood into the aorta. Valves keep the flow in order. The heart does not create blood. In the city model the hub does not create electricity.",
        points: ["Vena cava", "Right atrium and right ventricle", "Left atrium and left ventricle", "Aorta", "Valves"],
      },
      {
        n: "2",
        title: "The problem in Oman",
        text: "Homes, clinics and transport need reliable electricity. Demand rises with cooling in hot weather. Fossil fuels still sit behind much of that supply, so renewable energy has to be carried to the hours and the districts that need it. This board quotes no national demand figure and does not say the grid is universally unreliable.",
        points: ["Reliability for homes, health and transport", "Cooling demand in hot weather", "Fossil-fuel dependence and emissions", "Renewable supply has to be distributed and stored"],
      },
      {
        n: "3",
        title: "The sustainable solution",
        text: "Oman is adding large-scale solar and wind. A community model can add rooftop canopies, efficient buildings and a hub that shares what those roofs actually produce. Battery storage holds surplus. The hub circulates energy. It does not generate it.",
        points: ["Rooftop and canopy solar", "Energy-efficient buildings", "A distribution hub", "Storage for the hours after sunset"],
      },
      {
        n: "4",
        title: "Our working prototype",
        text: "Miniature solar canopies, a central distribution point, a small energy hub and district buildings. LEDs stand for distribution. They light to show a path. They are not a measurement of a real panel unless instruments say so. Use a current-limited low-voltage supply. Do not connect the model to household mains.",
        points: ["Miniature solar canopies", "Central distribution point", "Small-scale energy hub", "District LEDs"],
      },
      {
        n: "5",
        title: "Materials and build",
        points: ["Solar-panel representations", "Connecting wires", "LEDs and resistors", "A simple distribution hub", "Low-voltage power source", "Foam board"],
      },
      {
        n: "7",
        title: "How the demonstration works",
        text: "Power is indicated from the practical source, through the distribution hub, to the district LEDs. The lamps show which district is connected. Real panel output has to be checked with instruments. The LEDs only show the idea.",
      },
    ],
  },
};
