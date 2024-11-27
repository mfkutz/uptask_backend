import type { Request, Response } from "express";
import User from "../models/Users";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class AuthController {
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;

      //Duplicate prevent
      const userExists = await User.findOne({ email });
      if (userExists) {
        const error = new Error("El usuario ya está registrado");
        res.status(409).json({ error: error.message });
        return;
      }

      //user create
      const user = new User(req.body);

      //hash password
      user.password = await hashPassword(password);

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      //send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([user.save(), token.save()]);

      res.send("Cuenta creada, revisa tu email para confirmarla");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExists = await Token.findOne({ token });

      if (!tokenExists) {
        const error = new Error("Token no válido");
        res.status(404).json({ error: error.message });
        return;
      }

      const user = await User.findById(tokenExists.user);
      user.confirmed = true;

      await Promise.allSettled([user.save(), tokenExists.deleteOne()]);

      res.send("Cuenta confirmada correctametne");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        const error = new Error("Usuario no encontrado");
        res.status(404).json({ error: error.message });
        return;
      }
      if (!user.confirmed) {
        const token = new Token();
        token.user = user.id;
        token.token = generateToken();
        await token.save();

        //send email
        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token,
        });

        const error = new Error("La cuenta no ha sido confirmada, hemos enviado un e-mail de confirmación");
        res.status(404).json({ error: error.message });
        return;
      }

      //check password
      const isPasswordCorrect = await checkPassword(password, user.password);

      if (!isPasswordCorrect) {
        const error = new Error("Password incorrecto");
        res.status(404).json({ error: error.message });
        return;
      }

      //JWT
      const token = generateJWT({ id: user.id })
      console.log("aca el token", token)
      res.send(token);


    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      //User exists
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("El usuario no está registrado");
        res.status(404).json({ error: error.message });
        return;
      }

      if (user.confirmed) {
        const error = new Error("El usuario ya está confirmado");
        res.status(403).json({ error: error.message });
        return;
      }

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;

      //send email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      await Promise.allSettled([user.save(), token.save()]);

      res.send("Se envió un nuevo token a tu E-mail");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      //User exists
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("El usuario no está registrado");
        res.status(404).json({ error: error.message });
        return;
      }

      //Generate token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;
      await token.save();

      //send email
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token,
      });

      res.send("Revisa tu email para instrucciones");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const tokenExists = await Token.findOne({ token });

      if (!tokenExists) {
        const error = new Error("Token no válido");
        res.status(404).json({ error: error.message });
        return;
      }

      res.send("Token válido, define tu nuevo password");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updatePasswordWithToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body
      const tokenExists = await Token.findOne({ token });

      if (!tokenExists) {
        const error = new Error("Token no válido");
        res.status(404).json({ error: error.message });
        return;
      }

      const user = await User.findById(tokenExists.user)
      user.password = await hashPassword(password)


      await Promise.allSettled([user.save(), tokenExists.deleteOne()])

      res.send("El password se modifico correctamente ");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static user = async (req: Request, res: Response) => {
    res.json(req.recover_user)
    return
  };

  static updateProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body

    const userExists = await User.findOne({ email })

    if (userExists && userExists.id.toString() !== req.recover_user.id.toString()) {
      const error = new Error('Ese e-mail ya está registrado')
      res.status(409).send({ error: error.message })
      return
    }

    req.recover_user.name = name
    req.recover_user.email = email
    try {
      await req.recover_user.save()
      res.send('Perfil actualizado correctamente')
    } catch (error) {
      res.status(500).send('Hubo un error')
    }
  }

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body
    const user = await User.findById(req.recover_user.id)
    const isPasswordCorrect = await checkPassword(current_password, user.password)

    if (!isPasswordCorrect) {
      const error = new Error('El Password actual es incorrecto')
      res.status(401).send({ error: error.message })
      return
    }

    try {
      user.password = await hashPassword(password)
      await user.save()
      res.send('El Password se modificó correctamente')
    } catch (error) {
      res.status(500).send('Hubo un error')
    }
  }

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body
    const user = await User.findById(req.recover_user.id)
    const isPasswordCorrect = await checkPassword(password, user.password)

    if (!isPasswordCorrect) {
      const error = new Error('El Password es incorrecto')
      res.status(401).send({ error: error.message })
      return
    }

    res.send('Password Correcto')
  }

}


