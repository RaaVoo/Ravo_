function toChildrenResponseDto(children) {
  return children.map(child => ({
    user_no: child.user_no,
    u_name: child.u_name,
    u_birth: child.u_birth,
    u_gender: child.u_gender
  }));
}

export { toChildrenResponseDto };
