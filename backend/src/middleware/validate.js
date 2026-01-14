export function validate(schema){
  return (req,_res,next)=>{
    const result=schema.safeParse({ body:req.body, params:req.params, query:req.query, headers:req.headers });
    if(!result.success){
      const details=result.error.issues.map(i=>({path:i.path.join("."),message:i.message}));
      const err=new Error("Validation failed"); err.statusCode=400; err.code="VALIDATION_ERROR"; err.details=details;
      return next(err);
    }
    req.validated=result.data;
    next();
  };
}
