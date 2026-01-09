-- Tabla para almacenar las transacciones verificadas
create table if not exists transactions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reference text not null,
  amount numeric not null,
  phone text not null,
  date date not null,
  sender_bank text not null,
  receiver_bank text not null,
  status text not null, -- 'verified', 'pending', 'error'
  verification_id text,
  bank_response text,
  metadata jsonb
);

-- Habilitar Row Level Security (RLS)
alter table transactions enable row level security;

-- Política para permitir lectura pública (ajustar según necesidad)
create policy "Public read access"
  on transactions for select
  using (true);

-- Política para permitir inserción pública (ajustar según necesidad, idealmente solo authenticated)
create policy "Public insert access"
  on transactions for insert
  with check (true);

-- TABLA DE PRUEBA DE CONEXIÓN
create table if not exists connection_test (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  message text
);

-- Insertar un dato de prueba
insert into connection_test (message) values ('Conexión exitosa desde DokPloy!');

-- Habilitar RLS
alter table connection_test enable row level security;

-- Política de lectura pública
create policy "Public read access test"
  on connection_test for select
  using (true);
