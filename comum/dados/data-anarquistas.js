/* ============================================================
   VITAE — Movimento Anarquista
   Baronia, papéis e a economia de favores que substitui a corte.
   ============================================================ */

const TIPOS_BARONIA = [
  { id: 'bairro', nome: 'Baronia de bairro', territorio: 'Um bairro com fronteira reconhecida',
    tensao: 'A corte finge que não existe até precisar de alguma coisa.' },
  { id: 'corredor', nome: 'Corredor', territorio: 'Uma via e tudo o que ela liga',
    tensao: 'Ninguém mora no seu domínio. Todo mundo passa por ele.' },
  { id: 'cooperativa', nome: 'Cooperativa', territorio: 'Sem território: só gente e acordo',
    tensao: 'Sem terra para defender, e sem terra para se esconder.' },
  { id: 'ocupacao', nome: 'Ocupação', territorio: 'Um prédio, e a briga por ele',
    tensao: 'O dono legal ainda existe, e um dia volta com oficial de justiça.' }
];

const PAPEIS_BARONIA = [
  { id: 'barao', nome: 'Barão', desc: 'Responde pela baronia. Enquanto entregar.' },
  { id: 'emissario', nome: 'Emissário', desc: 'Fala com a corte, com outras baronias, com quem for.' },
  { id: 'varredor', nome: 'Varredor', desc: 'Contra-vigilância. Apaga o que a baronia deixa para trás.' },
  { id: 'braco', nome: 'Braço', desc: 'Resolve na força quando o resto já falhou.' },
  { id: 'nenhum', nome: 'Só mais um', desc: 'Sem papel definido. É a maioria.' }
];

const FAVORES_SUGERIDOS = [
  'Tirou seu corpo de uma cena de crime',
  'Emprestou refúgio numa madrugada perdida',
  'Mentiu para o Xerife por você',
  'Pagou o silêncio de uma testemunha',
  'Entregou um domínio de caça que era dele',
  'Sumiu com uma gravação'
];
