(define cadr
  (lambda (e) (car (cdr e))))
(cadr (quote ((a b) (c d) e)))
(define (cadr x)
  (car (cdr x)))
(cadr (quote ((a b) (1 2) e)))