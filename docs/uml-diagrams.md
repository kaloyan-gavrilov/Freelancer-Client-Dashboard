# UML Diagrams — Freelancer-Client Dashboard

## 1. Domain Entity Class Diagram

Core data models and their relationships (maps to PostgreSQL schema).

```mermaid
classDiagram
    direction TB

    class User {
        +UUID id
        +string email
        +UserRole role
        +string firstName
        +string lastName
        +string avatarUrl
        +string bio
        +Date createdAt
        +Date updatedAt
    }

    class Client {
        +UUID id
        +string companyName
        +string website
    }

    class Freelancer {
        +UUID id
        +Decimal hourlyRate
        +AvailabilityStatus availabilityStatus
        +string portfolioUrl
        +Decimal rating
        +int completedProjectsCount
        +Decimal onTimeDeliveryRate
    }

    class Project {
        +UUID id
        +UUID clientId
        +UUID freelancerId
        +string title
        +string description
        +Decimal budgetMin
        +Decimal budgetMax
        +Date deadline
        +ProjectStatus status
        +ProjectType projectType
        +Decimal agreedRate
        +Date createdAt
        +Date updatedAt
    }

    class Bid {
        +UUID id
        +UUID projectId
        +UUID freelancerId
        +Decimal proposedRate
        +int estimatedDurationDays
        +string coverLetter
        +BidStatus status
        +Date createdAt
        +Date updatedAt
    }

    class Milestone {
        +UUID id
        +UUID projectId
        +string title
        +string description
        +Decimal amount
        +int orderIndex
        +MilestoneStatus status
        +Date dueDate
        +Date submittedAt
        +Date approvedAt
    }

    class TimeEntry {
        +UUID id
        +UUID projectId
        +UUID freelancerId
        +UUID milestoneId
        +Decimal hours
        +string description
        +Date date
        +Date createdAt
        +Date updatedAt
    }

    class File {
        +UUID id
        +UUID uploaderId
        +UUID projectId
        +UUID milestoneId
        +string name
        +string filePath
        +int fileSize
        +string mimeType
        +FileType fileType
    }

    class Skill {
        +UUID id
        +string name
    }

    class Review {
        +UUID id
        +UUID projectId
        +UUID reviewerId
        +UUID revieweeId
        +int rating
        +string comment
    }

    class Dispute {
        +UUID id
        +UUID projectId
        +UUID initiatorId
        +string reason
        +string resolution
    }

    User <|-- Client : extends
    User <|-- Freelancer : extends

    Client "1" --> "0..*" Project : creates
    Freelancer "0..1" --> "0..*" Project : assigned to
    Project "1" --> "0..*" Bid : receives
    Freelancer "1" --> "0..*" Bid : submits
    Project "1" --> "0..*" Milestone : has
    Project "1" --> "0..*" TimeEntry : tracks
    Freelancer "1" --> "0..*" TimeEntry : logs
    Milestone "0..1" --> "0..*" TimeEntry : groups
    Project "1" --> "0..*" File : stores
    Milestone "0..1" --> "0..*" File : deliverables
    User "1" --> "0..*" File : uploads
    Project "0..*" --> "0..*" Skill : requires
    Freelancer "0..*" --> "0..*" Skill : has
    Project "1" --> "0..*" Review : receives
    Project "1" --> "0..1" Dispute : escalates to
```

---

## 2. Project Status State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT : project created
    DRAFT --> OPEN : client publishes
    DRAFT --> CANCELLED : client cancels

    OPEN --> IN_PROGRESS : bid accepted
    OPEN --> CANCELLED : client cancels

    IN_PROGRESS --> REVIEW : work submitted
    IN_PROGRESS --> DISPUTED : dispute filed
    IN_PROGRESS --> CANCELLED : client cancels

    REVIEW --> COMPLETED : client approves
    REVIEW --> IN_PROGRESS : client requests changes
    REVIEW --> DISPUTED : dispute filed

    DISPUTED --> COMPLETED : resolved
    DISPUTED --> CANCELLED : resolved & cancelled

    COMPLETED --> [*]
    CANCELLED --> [*]
```

---

## 3. Backend Architecture Class Diagram

NestJS layered architecture: Controller → Service → Repository → Supabase.

```mermaid
classDiagram
    direction LR

    class SupabaseAuthGuard {
        -supabase: SupabaseClient
        +canActivate(context) bool
        -extractToken(request) string
    }

    class RolesGuard {
        -reflector: Reflector
        +canActivate(context) bool
    }

    class ProjectsController {
        +create(dto, user) Project
        +findAll(query) PaginatedResponse
        +findById(id) Project
        +updateStatus(id, dto, user) Project
        +remove(id, user) void
    }

    class BidsController {
        +create(projectId, dto, user) Bid
        +findByProject(projectId, rankBy) Bid[]
        +accept(bidId, user) Bid
        +reject(bidId, user) Bid
    }

    class MilestonesController {
        +findByProject(projectId) Milestone[]
        +create(projectId, dto, user) Milestone
        +updateStatus(milestoneId, dto) Milestone
        +uploadFile(milestoneId, file, user) File
        +downloadFile(fileId, user) RedirectResponse
    }

    class TimeEntriesController {
        +create(projectId, dto, user) TimeEntry
        +findByProject(projectId) TimeEntry[]
    }

    class ProjectsService {
        -projectRepo: IProjectRepository
        +create(dto, clientId) Project
        +findAll(query) PaginatedResponse
        +findById(id) Project
        +updateStatus(id, status, clientId) Project
        +remove(id, clientId) void
    }

    class BidsService {
        -bidRepo: IBidRepository
        -projectRepo: IProjectRepository
        -rankingFactory: BidRankingStrategyFactory
        +create(projectId, dto, freelancerId) Bid
        +findByProject(projectId, rankBy) Bid[]
        +accept(bidId, clientId) Bid
        +reject(bidId, clientId) Bid
    }

    class MilestonesService {
        -milestoneRepo: IMilestoneRepository
        -fileRepo: IFileRepository
        +findByProject(projectId) Milestone[]
        +create(projectId, dto, clientId) Milestone
        +updateStatus(milestoneId, status) Milestone
        +uploadDeliverable(milestoneId, file, userId) File
        +getDownloadUrl(fileId, userId) string
    }

    class TimeEntriesService {
        -timeEntryRepo: ITimeEntryRepository
        +create(projectId, dto, freelancerId) TimeEntry
        +findByProject(projectId) TimeEntry[]
    }

    class BidRankingStrategyFactory {
        +getStrategy(rankBy) IBidRankingStrategy
    }

    class IProjectRepository {
        <<interface>>
        +create(data) Project
        +findAll(query) PaginatedResponse
        +findById(id) Project
        +update(id, data) Project
        +delete(id) void
    }

    class IBidRepository {
        <<interface>>
        +create(data) Bid
        +findByProject(projectId) Bid[]
        +findById(id) Bid
        +update(id, data) Bid
        +rejectOthers(projectId, acceptedBidId) void
    }

    class IMilestoneRepository {
        <<interface>>
        +findByProject(projectId) Milestone[]
        +create(data) Milestone
        +update(id, data) Milestone
    }

    class ITimeEntryRepository {
        <<interface>>
        +create(data) TimeEntry
        +findByProject(projectId) TimeEntry[]
    }

    class SupabaseProjectRepository {
        -supabase: SupabaseClient
    }

    class SupabaseBidRepository {
        -supabase: SupabaseClient
    }

    class SupabaseMilestoneRepository {
        -supabase: SupabaseClient
    }

    class SupabaseTimeEntryRepository {
        -supabase: SupabaseClient
    }

    SupabaseAuthGuard --> ProjectsController : guards
    RolesGuard --> ProjectsController : guards

    ProjectsController --> ProjectsService
    BidsController --> BidsService
    MilestonesController --> MilestonesService
    TimeEntriesController --> TimeEntriesService

    BidsService --> BidRankingStrategyFactory
    BidsService --> IProjectRepository
    ProjectsService --> IProjectRepository
    BidsService --> IBidRepository
    MilestonesService --> IMilestoneRepository
    TimeEntriesService --> ITimeEntryRepository

    IProjectRepository <|.. SupabaseProjectRepository
    IBidRepository <|.. SupabaseBidRepository
    IMilestoneRepository <|.. SupabaseMilestoneRepository
    ITimeEntryRepository <|.. SupabaseTimeEntryRepository
```

---

## 4. Frontend Component Architecture

React component tree, hooks, and API service layer.

```mermaid
classDiagram
    direction TB

    class App {
        +Router routes
        +AuthProvider
        +QueryClientProvider
    }

    class AuthProvider {
        -user: AuthUser
        -session: Session
        +login(email, password)
        +register(data)
        +logout()
    }

    class ProtectedRoute {
        +children: ReactNode
        -redirectTo: string
    }

    class RoleRoute {
        +allowedRoles: UserRole[]
        +children: ReactNode
    }

    class ClientDashboard {
        -clientId: string
        +useClientProjects()
        +renderProjectList()
        +renderStats()
    }

    class ProjectDetailPage {
        -projectId: string
        +useProject()
        +useBidsForProject()
        +useMilestones()
        +useTimeEntries()
        +renderOverviewTab()
        +renderBidsTab()
        +renderMilestonesTab()
        +renderTimelogTab()
    }

    class CreateProjectForm {
        +useCreateProject()
        +zodSchema: ZodSchema
        +onSubmit(data)
    }

    class BidList {
        +bids: Bid[]
        +useAcceptBid()
        +useRejectBid()
        +renderRankedBids()
    }

    class BidForm {
        +projectId: string
        +useSubmitBid()
        +zodSchema: ZodSchema
    }

    class ProjectMilestones {
        +projectId: string
        +useMilestones()
        +useCreateMilestone()
        +renderMilestoneList()
    }

    class TimeEntryList {
        +projectId: string
        +useTimeEntries()
        +useLogTime()
        +renderEntries()
    }

    class useProjects {
        <<hook>>
        +queryKey: string[]
        +fetchProjects(filters)
    }

    class useClientProjects {
        <<hook>>
        +queryKey: string[]
        +fetchClientProjects(clientId)
    }

    class useCreateProject {
        <<hook>>
        +mutate(dto)
        +invalidates: client-projects
    }

    class useBidsForProject {
        <<hook>>
        +queryKey: string[]
        +fetchBids(projectId)
    }

    class useAcceptBid {
        <<hook>>
        +mutate(bidId)
        +invalidates: bids, project
    }

    class useMilestones {
        <<hook>>
        +queryKey: string[]
        +fetchMilestones(projectId)
    }

    class useTimeEntries {
        <<hook>>
        +queryKey: string[]
        +fetchTimeEntries(projectId)
    }

    class useLogTime {
        <<hook>>
        +mutate(dto)
        +optimisticUpdate: true
    }

    class projectsApi {
        <<service>>
        +createProject(dto)
        +getProjects(query)
        +getProjectById(id)
        +updateProjectStatus(id, dto)
        +deleteProject(id)
    }

    class bidsApi {
        <<service>>
        +createBid(projectId, dto)
        +getBidsForProject(projectId, rankBy)
        +acceptBid(bidId)
        +rejectBid(bidId)
    }

    class milestonesApi {
        <<service>>
        +getMilestones(projectId)
        +createMilestone(projectId, dto)
        +updateMilestone(milestoneId, dto)
    }

    class timeEntriesApi {
        <<service>>
        +getTimeEntries(projectId)
        +createTimeEntry(projectId, dto)
    }

    App --> AuthProvider
    App --> ProtectedRoute
    App --> RoleRoute
    ProtectedRoute --> ClientDashboard
    ProtectedRoute --> ProjectDetailPage
    RoleRoute --> CreateProjectForm

    ProjectDetailPage --> BidList
    ProjectDetailPage --> ProjectMilestones
    ProjectDetailPage --> TimeEntryList

    ClientDashboard --> useClientProjects
    CreateProjectForm --> useCreateProject
    ProjectDetailPage --> useBidsForProject
    BidList --> useAcceptBid
    ProjectMilestones --> useMilestones
    TimeEntryList --> useTimeEntries
    TimeEntryList --> useLogTime

    useClientProjects --> projectsApi
    useCreateProject --> projectsApi
    useBidsForProject --> bidsApi
    useAcceptBid --> bidsApi
    useMilestones --> milestonesApi
    useTimeEntries --> timeEntriesApi
    useLogTime --> timeEntriesApi
```

---

## 5. Sequence Diagram — Bid Acceptance Flow

```mermaid
sequenceDiagram
    actor Client
    participant BidList as BidList (React)
    participant Hook as useAcceptBid (Hook)
    participant API as bidsApi (Axios)
    participant Guard as SupabaseAuthGuard
    participant RGuard as RolesGuard
    participant Ctrl as BidsController
    participant Svc as BidsService
    participant BidRepo as IBidRepository
    participant ProjRepo as IProjectRepository
    participant DB as Supabase (PostgreSQL)

    Client->>BidList: click "Accept" on bid
    BidList->>Hook: mutate(bidId)
    Hook->>API: PATCH /bids/:bidId/accept
    Note over API: Attach JWT in Authorization header

    API->>Guard: HTTP request with Bearer token
    Guard->>DB: supabase.auth.getUser(token)
    DB-->>Guard: { user, role: CLIENT }
    Guard-->>Ctrl: request.user populated

    Guard->>RGuard: check @Roles(CLIENT)
    RGuard-->>Ctrl: authorized ✓

    Ctrl->>Svc: accept(bidId, clientId)
    Svc->>BidRepo: findById(bidId)
    BidRepo->>DB: SELECT * FROM bids WHERE id = bidId
    DB-->>BidRepo: Bid { status: PENDING }
    BidRepo-->>Svc: bid

    Note over Svc: Validate bid.status === PENDING

    Svc->>ProjRepo: findById(bid.projectId)
    ProjRepo->>DB: SELECT * FROM projects WHERE id = bid.projectId
    DB-->>ProjRepo: Project { clientId, status: OPEN }
    ProjRepo-->>Svc: project

    Note over Svc: Validate project.clientId === clientId

    Svc->>BidRepo: rejectOthers(projectId, bidId)
    BidRepo->>DB: UPDATE bids SET status='REJECTED' WHERE project_id=? AND id != ?
    DB-->>BidRepo: updated rows

    Svc->>BidRepo: update(bidId, { status: ACCEPTED })
    BidRepo->>DB: UPDATE bids SET status='ACCEPTED' WHERE id = bidId
    DB-->>BidRepo: updated bid

    Svc->>ProjRepo: update(projectId, { status: IN_PROGRESS, freelancerId, agreedRate })
    ProjRepo->>DB: UPDATE projects SET status='IN_PROGRESS', freelancer_id=?, agreed_rate=?
    Note over DB: DB trigger validates state transition (OPEN → IN_PROGRESS ✓)
    Note over DB: DB trigger inserts into project_state_history
    DB-->>ProjRepo: updated project

    Svc-->>Ctrl: accepted Bid
    Ctrl-->>API: 200 OK { bid }
    API-->>Hook: Bid { status: ACCEPTED }

    Hook->>Hook: invalidate ['bids', projectId]
    Hook->>Hook: invalidate ['project', projectId]

    Hook-->>BidList: re-render with updated state
    BidList-->>Client: bid shows "ACCEPTED" badge, project tab updates
```

---

## 6. Sequence Diagram — Project Creation Flow

```mermaid
sequenceDiagram
    actor Client
    participant Form as CreateProjectForm
    participant Hook as useCreateProject (Hook)
    participant API as projectsApi (Axios)
    participant Guard as SupabaseAuthGuard
    participant Ctrl as ProjectsController
    participant Svc as ProjectsService
    participant Repo as IProjectRepository
    participant DB as Supabase (PostgreSQL)

    Client->>Form: fill form & click "Create"
    Form->>Form: zod.parse(formData) — validate
    Note over Form: title, description, budgetMin/Max, deadline, projectType, skills

    Form->>Hook: mutate(createProjectDto)

    Hook->>API: POST /projects { dto }
    API->>Guard: HTTP request
    Guard->>DB: supabase.auth.getUser(token)
    DB-->>Guard: { user, role: CLIENT }
    Guard-->>Ctrl: request.user populated

    Ctrl->>Svc: create(dto, user.id)
    Svc->>Repo: create({ ...dto, clientId, status: DRAFT })
    Repo->>DB: INSERT INTO projects (...)
    DB-->>Repo: Project { status: DRAFT }
    Repo-->>Svc: project
    Svc-->>Ctrl: project
    Ctrl-->>API: 201 Created { project }

    API->>API: PATCH /projects/:id/status { status: OPEN }
    Note over API: Auto-transition DRAFT to OPEN
    API->>Guard: HTTP request
    Guard-->>Ctrl: authorized ✓
    Ctrl->>Svc: updateStatus(id, OPEN, clientId)
    Svc->>Svc: ProjectStateMachine.validate(DRAFT to OPEN)
    Svc->>Repo: update(id, { status: OPEN })
    Repo->>DB: UPDATE projects SET status='OPEN'
    DB-->>Repo: updated project
    Repo-->>Svc: project
    Svc-->>Ctrl: project
    Ctrl-->>API: 200 OK { project }
    API-->>Hook: Project { status: OPEN }

    Hook->>Hook: invalidate ['client-projects', clientId]
    Hook-->>Form: success
    Form-->>Client: redirect to /projects/:id
```

---

## 7. Sequence Diagram — Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant AuthCtx as AuthProvider (Context)
    participant Supabase as Supabase Auth
    participant DB as Supabase (PostgreSQL)
    participant Backend as NestJS API

    User->>LoginPage: enter email + password
    LoginPage->>AuthCtx: login(email, password)
    AuthCtx->>Supabase: signInWithPassword({ email, password })
    Supabase->>DB: validate credentials
    DB-->>Supabase: user record
    Supabase-->>AuthCtx: { session, user }

    AuthCtx->>DB: SELECT * FROM users WHERE id = user.id
    DB-->>AuthCtx: { id, email, role, firstName, lastName }
    AuthCtx->>AuthCtx: setUser(profile) and setSession(session)

    AuthCtx-->>LoginPage: authenticated
    LoginPage-->>User: redirect based on role
    Note over User: CLIENT to /client/dashboard
    Note over User: FREELANCER to /freelancer/dashboard

    Note over AuthCtx, Backend: Subsequent API calls
    AuthCtx->>Backend: GET /projects (Authorization: Bearer <JWT>)
    Backend->>Supabase: supabase.auth.getUser(token)
    Supabase-->>Backend: { id, email }
    Backend->>DB: SELECT role FROM users WHERE id = ?
    DB-->>Backend: { role }
    Backend-->>AuthCtx: protected resource data
```
