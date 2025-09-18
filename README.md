# Health Services Microservices

A modern healthcare appointment management system built with Node.js microservices and Kubernetes.

## Architecture

This project implements a microservices architecture for a healthcare appointment system with three main services:

1. **Patient Service**: Manages patient data and records
2. **Doctor Service**: Manages doctor profiles and availability
3. **Appointment Service**: Handles scheduling and management of appointments

All services connect to a shared PostgreSQL database, but each service operates within its own schema to maintain data isolation.

## Database Design

The system uses PostgreSQL with the following schema structure:

- **patient.patients**: Stores patient information
- **doctor.doctors**: Stores doctor information
- **appointment.appointments**: Stores appointment data with foreign key relationships to both patients and doctors

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **API Validation**: Joi
- **Logging**: Winston
- **Container Orchestration**: Kubernetes
- **Containerization**: Docker

## Project Structure

```
health-services-microservices/
├── appointment-service/         # Appointment microservice
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   ├── models/              # Database models and queries
│   │   ├── routes/              # API routes
│   │   ├── middlewares/         # Custom middlewares
│   │   └── index.js             # Service entry point
│   ├── Dockerfile               # Docker container configuration
│   └── package.json             # Dependencies and scripts
├── doctor-service/              # Doctor microservice (similar structure)
├── patient-service/             # Patient microservice (similar structure)
├── shared/                      # Shared utilities
│   ├── db.js                    # Database connection
│   ├── error-handler.js         # Error handling utilities
│   └── package.json             # Shared dependencies
├── k8s/                         # Kubernetes configurations
│   ├── appointment-service/     # Appointment service K8s files
│   ├── doctor-service/          # Doctor service K8s files
│   ├── patient-service/         # Patient service K8s files
│   ├── postgres/                # Database K8s files
│   └── api-gateway/             # API Gateway and routing
└── README.md                    # Project documentation
```

## API Endpoints

### Patient Service (port 3001)

- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get a specific patient
- `POST /api/patients` - Create a new patient
- `PUT /api/patients/:id` - Update a patient
- `DELETE /api/patients/:id` - Delete a patient
- `GET /api/patients/:id/appointments` - Get appointments for a patient

### Doctor Service (port 3002)

- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get a specific doctor
- `GET /api/doctors/specialization/:specialization` - Get doctors by specialization
- `POST /api/doctors` - Create a new doctor
- `PUT /api/doctors/:id` - Update a doctor
- `DELETE /api/doctors/:id` - Delete a doctor
- `GET /api/doctors/:id/appointments` - Get appointments for a doctor
- `GET /api/doctors/:id/schedule` - Get a doctor's schedule for a date range

### Appointment Service (port 3003)

- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get a specific appointment
- `POST /api/appointments` - Create a new appointment
- `PUT /api/appointments/:id` - Update an appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `DELETE /api/appointments/:id` - Delete an appointment
- `GET /api/appointments/doctor/:doctorId` - Get appointments for a doctor
- `GET /api/appointments/patient/:patientId` - Get appointments for a patient
- `GET /api/appointments/status/:status` - Get appointments by status
- `GET /api/appointments/date-range` - Get appointments by date range

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (Minikube for local development)
- Node.js 16+ (for local development)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd health-services-microservices
   ```

2. Install dependencies for all services:
   ```bash
   cd shared && npm install && cd ..
   cd patient-service && npm install && cd ..
   cd doctor-service && npm install && cd ..
   cd appointment-service && npm install && cd ..
   ```

3. Create .env files in each service directory:
   ```bash
   cp patient-service/.env.example patient-service/.env
   cp doctor-service/.env.example doctor-service/.env
   cp appointment-service/.env.example appointment-service/.env
   ```

4. Start PostgreSQL (using Docker):
   ```bash
   docker run -d --name health-postgres -p 5432:5432 \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=health_services \
     postgres:14
   ```

5. Initialize the database schema:
   ```bash
   psql -U postgres -d health_services -f shared/db-schema.sql
   ```

6. Start each service:
   ```bash
   cd patient-service && npm run dev
   cd doctor-service && npm run dev
   cd appointment-service && npm run dev
   ```

### Deploying to Kubernetes

1. Build Docker images for each service:
   ```bash
   docker build -t health-services/patient-service:latest ./patient-service
   docker build -t health-services/doctor-service:latest ./doctor-service
   docker build -t health-services/appointment-service:latest ./appointment-service
   ```

2. Apply Kubernetes configurations:
   ```bash
   kubectl apply -f k8s/postgres/
   kubectl apply -f k8s/patient-service/
   kubectl apply -f k8s/doctor-service/
   kubectl apply -f k8s/appointment-service/
   kubectl apply -f k8s/api-gateway/
   ```

3. Verify deployments:
   ```bash
   kubectl get pods
   kubectl get services
   ```

## Data Flow and Relationships

The microservices architecture allows each service to operate independently, but they share data through the PostgreSQL database:

- **Patient-Appointment Relationship**: One-to-Many (One patient can have many appointments)
- **Doctor-Appointment Relationship**: One-to-Many (One doctor can have many appointments)

## Future Improvements

- Implement authentication and authorization
- Add API rate limiting
- Create a notification service for appointment reminders
- Implement service discovery using tools like Consul or etcd
- Add metrics and monitoring with Prometheus and Grafana
- Implement distributed tracing with Jaeger or Zipkin

## License

This project is licensed under the MIT License - see the LICENSE file for details.
