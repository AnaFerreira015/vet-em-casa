# vet-em-casa

Aplicativo web (PWA) para atendimento veterinário a domicílio e pet sitting. Tutores cadastram seus pets e solicitam agendamentos; a veterinária gerencia a agenda, os tutores e os pets.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19, SSR, server functions)
- [Supabase](https://supabase.com) (autenticação, Postgres com RLS, storage privado)
- Tailwind CSS 4 e componentes Radix UI
- Deploy em Cloudflare Workers (via Nitro)

## Rodando localmente

Requisitos: [Bun](https://bun.sh) 1.x (ou Node 22+).

```sh
cp .env.example .env   # preencha com as chaves do seu projeto Supabase
bun install
bun run dev            # http://localhost:8080
```

## Banco de dados

As migrações estão em `drizzle/migrations`. Para aplicar em um projeto Supabase novo, defina `DATABASE_URL` no `.env` (Supabase > Project Settings > Database > Connection string) e rode:

```sh
bunx drizzle-kit migrate
```

Depois que a veterinária criar a conta pelo app, promova-a manualmente:

```sql
insert into public.user_roles (user_id, role) values ('<uuid-da-conta>', 'vet');
```

## Scripts

| Comando           | O que faz                                 |
| ----------------- | ----------------------------------------- |
| `bun run dev`     | Servidor de desenvolvimento               |
| `bun run build`   | Build de produção para Cloudflare Workers |
| `bun run preview` | Serve o build localmente                  |
| `bun run lint`    | ESLint                                    |
| `bun run test`    | Testes (Vitest)                           |

## Segurança

Regras de arquitetura (papéis, RLS, dados de acesso à casa, LGPD) estão em [AGENTS.md](AGENTS.md). O plano da Fase 1 está em [docs/plano-fase-1.md](docs/plano-fase-1.md).
