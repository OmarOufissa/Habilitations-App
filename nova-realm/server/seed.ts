import { dbRun, getDatabase } from "./db";

interface DivisionStructure {
  name: string;
  services: ServiceStructure[];
}

interface ServiceStructure {
  name: string;
  sections: SectionStructure[];
}

interface SectionStructure {
  name: string;
  equipes: string[];
}

const ORGANIZATIONAL_STRUCTURE: DivisionStructure[] = [
  {
    name: "Division Exploitation Casa",
    services: [
      {
        name: "Service Maintenance Casa",
        sections: [
          {
            name: "Section Ligne Casa",
            equipes: ["Equipe Ligne", "Equipe TST Ligne Casa"]
          },
          {
            name: "Section Poste Casa",
            equipes: ["Equipe Poste Casa", "Equipe Poste Settat"]
          },
          {
            name: "Section Contrôle et Commande Casa",
            equipes: ["Equipe Contrôle et Commande Casa"]
          },
          {
            name: "Section Télécom Casa",
            equipes: ["Equipe Télécom Casa"]
          }
        ]
      },
      {
        name: "Service Conduite et Exploitation Casa",
        sections: [
          {
            name: "Groupement Casa",
            equipes: ["Equipe Conduite Casa", "Equipe TST Poste Casa"]
          },
          {
            name: "Groupement Settat",
            equipes: ["Equipe Conduite Settat"]
          }
        ]
      }
    ]
  },
  {
    name: "Division Exploitation El Jadida",
    services: [
      {
        name: "Service Maintenance El Jadida",
        sections: [
          {
            name: "Section Ligne El Jadida",
            equipes: ["Equipe Ligne El Jadida", "Equipe Ligne Safi", "Equipe TST Ligne El Jadida"]
          },
          {
            name: "Section Poste El Jadida",
            equipes: ["Equipe Poste El Jadida", "Equipe Poste Safi"]
          },
          {
            name: "Section Contrôle et Commande El Jadida",
            equipes: ["Equipe Contrôle et Commande El Jadida"]
          },
          {
            name: "Section Télécom El Jadida",
            equipes: ["Equipe Télécom Afourer"]
          }
        ]
      },
      {
        name: "Service Conduite et Exploitation El Jadida",
        sections: [
          {
            name: "Groupement El Jadida",
            equipes: ["Equipe Conduite Jorf Lasfer", "Equipe Conduite Ghanem", "Equipe Conduite Sidi Bennour"]
          },
          {
            name: "Groupement Safi",
            equipes: ["Equipe Conduite et Exploitation Safi", "Equipe Conduite Chemaia", "Equipe Conduite Bouguedra"]
          },
          {
            name: "Section Programmation",
            equipes: []
          }
        ]
      }
    ]
  },
  {
    name: "Division Exploitation AFOURER",
    services: [
      {
        name: "Service Maintenance Afourer",
        sections: [
          {
            name: "Section Ligne Afourer",
            equipes: ["Equipe Lignes Afourer", "Equipe Lignes Tadla", "Equipe Lignes Kalaa", "Equipe TST Lignes Afourer"]
          },
          {
            name: "Section Poste Afourer",
            equipes: ["Equipe Postes Afourer"]
          },
          {
            name: "Section Contrôle et Commande Afourer",
            equipes: ["Equipe Contrôle et Commande Afourer"]
          },
          {
            name: "Section Télécom Afourer",
            equipes: ["Equipe Télécom Afourer"]
          }
        ]
      },
      {
        name: "Service Conduite et Exploitation Afourer",
        sections: [
          {
            name: "Groupement Afourer",
            equipes: ["Equipe Conduite Afourer", "Equipe Conduite Khouribga", "Equipe Conduite Bengurir", "Equipe TST Postes Afourer"]
          },
          {
            name: "Groupement El Kalaa",
            equipes: ["Equipe Conduite Kalaa"]
          }
        ]
      }
    ]
  }
];

function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    getDatabase();

    // Clear existing data
    dbRun("DELETE FROM employees");
    dbRun("DELETE FROM habilitations");
    dbRun("DELETE FROM equipes");
    dbRun("DELETE FROM sections");
    dbRun("DELETE FROM services");
    dbRun("DELETE FROM divisions");
    console.log("Cleared existing data");

    // Seed organizational structure
    const divisions: { [key: string]: number } = {};
    const services: { [key: string]: number } = {};
    const sections: { [key: string]: number } = {};
    const equipes: { [key: string]: number } = {};

    // Seed divisions
    for (const division of ORGANIZATIONAL_STRUCTURE) {
      const result = dbRun(
        `INSERT INTO divisions (name) VALUES (?)`,
        [division.name]
      );
      const divisionId = (result as any).lastInsertRowid;
      divisions[division.name] = divisionId;

      // Seed services
      for (const service of division.services) {
        const serviceKey = `${division.name}|${service.name}`;
        const serviceResult = dbRun(
          `INSERT INTO services (name, division_id) VALUES (?, ?)`,
          [service.name, divisionId]
        );
        const serviceId = (serviceResult as any).lastInsertRowid;
        services[serviceKey] = serviceId;

        // Seed sections
        for (const section of service.sections) {
          const sectionKey = `${serviceKey}|${section.name}`;
          const sectionResult = dbRun(
            `INSERT INTO sections (name, service_id) VALUES (?, ?)`,
            [section.name, serviceId]
          );
          const sectionId = (sectionResult as any).lastInsertRowid;
          sections[sectionKey] = sectionId;

          // Seed equipes
          for (const equipe of section.equipes) {
            const equipeKey = `${sectionKey}|${equipe}`;
            const equipeResult = dbRun(
              `INSERT INTO equipes (name, section_id) VALUES (?, ?)`,
              [equipe, sectionId]
            );
            const equipeId = (equipeResult as any).lastInsertRowid;
            equipes[equipeKey] = equipeId;
          }
        }
      }
    }

    console.log("✓ Organizational structure seeded successfully!");
    console.log(`✓ Created ${Object.keys(divisions).length} divisions`);
    console.log(`✓ Created ${Object.keys(services).length} services`);
    console.log(`✓ Created ${Object.keys(sections).length} sections`);
    console.log(`✓ Created ${Object.keys(equipes).length} équipes`);
    console.log("\nDatabase ready for employee data import");
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

// Excel data from user
const EXCEL_DATA = `MATRICULE	Nom	Prénom		DIVISION	SERVICE	SECTION	EQUIPE	Fonction	HNE	HNE	HE1HT	HE1HT	HE2HT	HE2HT	HEC	HEC	HER	HE1ST	HE1ST	HE2ST	HE2ST	HSF6	N° du titre	Date Validation	Date Expiration 79276	BALHADDAD	BADRE		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe TST Ligne Casa	CADRE LIGNE					H2V		HC					H2N	H2T		263_06/22	1/7/2022	1/7/2025 85024	FALOUSS	BASSAM		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe Ligne	MONTEUR DE LIGNE			H1V							H1N					DTC/XC/37-02/24	1/7/2024	1/7/2025 84923	AOUAD	MOUAD		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe Ligne	MONTEUR DE LIGNE			H1V							H1N					DTC/XC/39_02/24	26/7/2024	25/7/2025 82307	ABAD	HAMZA		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe Ligne	Operateur TST Ligne			H1V							H1N	H1T				300_03/22	1/10/2022	1/10/2025 84817	AIT DASSAR	HAMZA		Division Exploitation Casa	Service Conduite et Exploitation Casa	Groupement Casa	Equipe Conduite  Casa	ouvrier professionnel			H1V	B1V											271_01/22	1/10/2022	1/10/2025 81914	AKRIM	AMINE		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe Ligne	CHEF EQUIPE LIGNE					H2V		HC								287_03/22	1/10/2022	1/10/2025 83516	AZIZ	MOHAMED		Division Exploitation Casa	Service Conduite et Exploitation Casa	Groupement Casa	Equipe Conduite  Casa	Chef de quart			H1V	B1V			HC	BC	BR						266_03/22	1/10/2022	1/10/2025 82620	BAKHOUCH	MOHAMMED		Division Exploitation Casa	Service Maintenance Casa 	Section Ligne Casa	Equipe Ligne	CHEF EQUIPE LIGNE 					H2V		HC					H2N	H2T		293_03/22	1/10/2022	1/10/2025 84706	BELLAOUALI	ABDELILAH		Division Exploitation Casa	Service Conduite et Exploitation Casa	Groupement Casa	Equipe Conduite  Casa	ouvrier professionnel			H1V	B1V											272_01/22	1/10/2022	1/10/2025 84632	BOUGHDIR	ABDELMONIM		Division Exploitation Casa	Service Conduite et Exploitation Casa	Groupement Casa	Equipe Conduite mécanicien	H0V	B0V													259_01/22	1/10/2022	1/10/2025`;

// Run seeding if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export { seedDatabase, EXCEL_DATA };
