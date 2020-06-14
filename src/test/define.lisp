(define cadr
  (lambda (e) (car (cdr e))))
(cadr (quote ((a b) (c d) e)))