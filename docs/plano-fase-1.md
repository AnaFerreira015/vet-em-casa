# App Eduarda Nunes — Médica Veterinária (CRMV-AL 02124)

Proposta do modelo de dados e das regras de segurança, para sua aprovação antes de construir a Fase 1.

## Identidade visual (extraída dos prints)

- Roxo (primária): ~#6E2A73 — contraste ótimo sobre o creme.
- Verde-água (secundária): ~#3FA3A3 no original. **Sobre o creme ele não atinge 4.5:1 para texto**, então uso um tom mais escuro (~#1F7A7A) em textos e botões; o tom original fica só em ícones e detalhes decorativos.
- Fundo creme ~#FCF5EA, texto roxo-escuro ~#3A1D3E. Sucesso verde, alerta âmbar escuro, erro vermelho — todos ajustados para 4.5:1.
- Fontes: Montserrat (títulos e textos, igual ao logo) e uma fonte manuscrita (Caveat Brush) só para destaques como "domiciliar".
- Logo no cabeçalho e na tela de login; nome + CRMV no rodapé.

## Perfis

- `vet` (admin) e `tutor`, guardados em tabela própria. Todo novo cadastro vira tutor; a conta da Eduarda é promovida a vet manualmente uma única vez.

## Modelo de dados

```text
user_roles        (user_id, role: vet|tutor)
profiles          (id = auth user, nome, telefone, endereço, bairro, cidade,
                   cep, contato_emergencia, consentimento_lgpd_em, criado_em)
home_access       (tutor_id, código_alarme, local_chave, instruções_acesso,
                   atualizado_em)              -- dados sensíveis separados
pets              (id, tutor_id, nome, espécie, raça, sexo, nascimento, peso_kg,
                   foto_path, temperamento, observações)
appointments      (id, tutor_id, pet_id, serviço: consulta|vacina|retorno|pet_sitting,
                   início, fim (para período), status: pendente|confirmado|
                   concluído|cancelado|recusado, observações_tutor,
                   observações_vet, remarcado_de)
pet_sitting_details (appointment_id, rotina_alimentação, medicações,
                   instruções_casa, contato_emergência)
```

Preparadas agora (vazias, para fases futuras):

```text
medical_records, vaccinations (com próxima_dose para lembretes),
visit_reports + visit_report_photos + checklist,
documents (receita/atestado, pdf_path), payments (valor, método, pago_em, pix)
```

Validações no banco: tamanho máximo de textos, peso > 0, fim >= início, datas de nascimento não futuras, e as mesmas regras no formulário.

## Regras de acesso (RLS em todas as tabelas)

- Função segura `has_role(usuário, papel)` usada pelas regras (sem recursão).
- **user_roles**: cada um lê só o próprio papel; ninguém altera pelo app.
- **profiles**: tutor lê/edita só o próprio; vet lê todos.
- **pets**: tutor lê/cria/edita/apaga só os seus (`tutor_id = usuário`); vet lê e edita todos.
- **appointments**: tutor lê os seus e cria só como `pendente`; pode apenas cancelar. Vet lê tudo e muda status/data (aceitar, recusar, remarcar).
- **pet_sitting_details**: segue o dono do agendamento; vet lê tudo.
- **home_access**: tutor pode **inserir, atualizar e apagar**, mas **não ler** depois de salvo; só a vet lê. Botão "Apagar dados de acesso" para o tutor após o serviço.
- **Tabelas futuras**: vet escreve; tutor só lê o que é dos próprios pets (pagamentos: só os seus).
- **Fotos**: bucket privado `pet-photos` (e `visit-photos`, `documents` futuros), pasta por tutor; acesso via links assinados de 5 minutos. Nenhuma chave secreta no navegador.

## LGPD

- Caixa de consentimento obrigatória no cadastro (data gravada).
- "Exportar meus dados" (baixa arquivo JSON) e "Excluir minha conta" (apaga tudo em cascata, inclusive fotos).

## Telas da Fase 1

- Público: início, login, cadastro, esqueci a senha.
- Tutor: meus pets (criar/editar com foto), novo agendamento (com campos extras para pet sitting), meus agendamentos com status, meus dados/privacidade.
- Vet: agenda do dia e da semana, solicitações pendentes (aceitar/recusar/remarcar), tutores e pets com busca, botões "Abrir no Google Maps" e "Abrir no Waze" (links simples, sem API).

## Acessibilidade

Fonte base 18px, botões ≥ 44px, foco visível, rótulos em todos os campos, mensagens de erro em texto (não só cor), navegação por teclado, textos alternativos.

## Instalável no celular

Ícone e nome para "Adicionar à tela inicial" (sem modo offline nesta fase).

## Detalhes técnicos

- Supabase (auth por e-mail, Postgres, storage), TanStack Start, server functions com `requireSupabaseAuth` para exportar/excluir conta.
- Trigger cria `profiles` + papel `tutor` no cadastro; enums para serviço/status; `on delete cascade` a partir de `auth.users`.
- Promoção a vet: `insert into user_roles` manual após a Eduarda criar a conta.
