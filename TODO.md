# TODO: Ajustar Página de Cadastro

## Tarefas Pendentes
- [x] Adicionar campos ao formulário de cadastro em login.html: Nome completo, Telefone, Repetir senha
- [x] Verificar e ajustar auth.js para lidar com os novos campos (validação e envio)
- [x] Testar o formulário de cadastro após as mudanças

## Informações Gathered
- Página de cadastro localizada em login.html, no formulário id="registerForm"
- Campos atuais: Email e Senha
- Novos campos solicitados: Nome completo, Telefone, Repetir senha

## Plano Detalhado
1. Editar login.html para inserir os novos campos no formulário de cadastro, mantendo a estrutura existente.
2. Ajustar auth.js se necessário para incluir validação dos novos campos (ex: confirmar se senhas coincidem).
3. Verificar se o backend (server.js) precisa de ajustes para receber os novos dados, mas focar primeiro no frontend.

## Dependências
- Nenhum arquivo adicional precisa ser editado inicialmente além de login.html e possivelmente auth.js.

## Followup Steps
- Após edição, testar o formulário localmente.
- Se houver erros, ajustar validações ou backend.
